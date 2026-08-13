/**
 * Đồng bộ tự động: máy tính và điện thoại cùng đọc ghi một file trên GitHub.
 *
 * Một lượt đồng bộ = đọc bản trên mạng → gộp ba chiều với bản máy này → ghi lại.
 *
 * Ba chiều nghĩa là có `base`: bản chụp của **lần đồng bộ trước**, cất riêng
 * trong máy. Thiếu nó thì không phân biệt được "bên kia thêm mới" với "bên này
 * đã xoá", và mọi phép cộng dồn số bài đã ôn trong ngày đều thành đoán mò. Xem
 * luật gộp ở src/lib/sync.ts.
 *
 * Chỗ dễ mất dữ liệu nhất là hai máy ghi cùng lúc. GitHub cho mỗi bản một mã
 * `sha`; ghi mà nộp `sha` cũ là bị từ chối. Gặp vậy thì đọc lại, gộp lại, ghi
 * lại — chứ tuyệt đối không ghi đè bừa.
 */

import { emptyAppData } from "./defaults";
import type { FetchLike, GithubTarget } from "./github";
import { GithubError, pullFile, pushFile } from "./github";
import { parseBackup } from "./normalise";
import type { MergeReport } from "./sync";
import { describeMerge, mergeData } from "./sync";
import type { AppData } from "./types";

/** Tên file cất trong máy, ngoài data.json. */
export const BASE_FILE = "sync-base.json";
export const CONFIG_FILE = "sync-config.json";

export interface SyncConfig {
  enabled: boolean;
  /** "chu-tai-khoan/ten-repo" */
  repo: string;
  /**
   * Token GitHub. Cố ý **không** nằm trong data.json: data.json còn được xuất
   * ra, gửi qua Zalo, chép sang thư mục Drive — token đi kèm là coi như cho
   * không người khác quyền ghi vào repo của bạn.
   */
  token: string;
  file: string;
  /** Lần đồng bộ gần nhất, dạng ISO. Rỗng = chưa lần nào. */
  lastSyncAt: string;
}

export function emptySyncConfig(): SyncConfig {
  return { enabled: false, repo: "", token: "", file: "data.json", lastSyncAt: "" };
}

export function readSyncConfig(text: string | null): SyncConfig {
  if (!text) return emptySyncConfig();
  try {
    const raw = JSON.parse(text) as Partial<SyncConfig>;
    return {
      ...emptySyncConfig(),
      ...raw,
      // Đọc từ file hỏng cũng không được để lọt kiểu dữ liệu lạ vào URL.
      repo: typeof raw.repo === "string" ? raw.repo.trim() : "",
      token: typeof raw.token === "string" ? raw.token.trim() : "",
      file: typeof raw.file === "string" && raw.file ? raw.file : "data.json",
    };
  } catch {
    return emptySyncConfig();
  }
}

export interface SyncOutcome {
  /** Dữ liệu sau khi gộp. */
  data: AppData;
  /** Máy này có phải thay dữ liệu đang mở không. */
  changed: boolean;
  /** Có ghi lên mạng không. */
  pushed: boolean;
  /** Câu báo cho người dùng. */
  note: string;
  report?: MergeReport;
}

/**
 * Xâu JSON có thứ tự khoá cố định.
 *
 * `JSON.stringify` giữ nguyên thứ tự khoá của từng object, mà bản đọc từ mạng
 * đi qua `normalise()` nên các trường được dựng lại theo thứ tự khác bản trong
 * bộ nhớ. Hai sổ giống hệt nhau về nội dung vẫn ra hai chuỗi khác nhau — và
 * app tưởng có thay đổi nên lần đồng bộ nào cũng ghi lên GitHub một lần vô ích.
 */
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

/** So hai sổ theo nội dung, bỏ qua mốc `updatedAt` vì mỗi lần gộp là nó đổi. */
function same(a: AppData, b: AppData): boolean {
  return stable({ ...a, updatedAt: "" }) === stable({ ...b, updatedAt: "" });
}

export interface SyncDeps {
  config: SyncConfig;
  local: AppData;
  /** Đọc bản chụp lần đồng bộ trước. */
  readBase(): Promise<string | null>;
  writeBase(text: string): Promise<void>;
  doFetch: FetchLike;
  /** Tên máy, để lời nhắn commit nói rõ ai vừa ghi. */
  device?: string;
}

/** Bao nhiêu lần thử lại khi máy kia ghi chen vào giữa chừng. */
const RETRIES = 3;

export async function syncOnce(deps: SyncDeps): Promise<SyncOutcome> {
  const target: GithubTarget = {
    repo: deps.config.repo,
    token: deps.config.token,
    file: deps.config.file || "data.json",
  };

  let lastConflict: GithubError | null = null;

  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    const remote = await pullFile(target, deps.doFetch);

    let merged: AppData;
    let report: MergeReport | undefined;

    if (remote.text === null) {
      // Repo còn trống: lần đầu thì đẩy nguyên bản máy này lên, không gộp gì cả.
      merged = deps.local;
    } else {
      const parsed = parseBackup(remote.text, emptyAppData());
      if ("error" in parsed) {
        // File trên mạng hỏng. Ghi đè lên nó là xoá luôn dữ liệu của máy kia,
        // nên dừng lại và để người dùng quyết.
        throw new GithubError(
          `File trên GitHub không đọc được (${parsed.error}). Dừng lại để bạn xem, không ghi đè.`,
          0,
        );
      }

      const baseText = await deps.readBase();
      const base = baseText
        ? (() => {
            const b = parseBackup(baseText, emptyAppData());
            return "error" in b ? null : b.data;
          })()
        : null;

      const result = mergeData(base, deps.local, parsed.data);
      merged = result.data;
      report = result.report;

      // Cả hai bên y như nhau: chỉ ghi lại bản chụp rồi thôi.
      if (same(merged, parsed.data) && same(merged, deps.local)) {
        await deps.writeBase(JSON.stringify(merged));
        return {
          data: deps.local,
          changed: false,
          pushed: false,
          note: "Hai bên đã giống nhau.",
          report,
        };
      }

      // Máy này chỉ đang thiếu phần của máy kia, không có gì để đẩy lên.
      if (same(merged, parsed.data)) {
        await deps.writeBase(JSON.stringify(merged));
        return {
          data: merged,
          changed: true,
          pushed: false,
          note: describeMerge(report),
          report,
        };
      }
    }

    try {
      const stamp = new Date().toISOString().replace("T", " ").slice(0, 16);
      await pushFile(
        target,
        JSON.stringify(merged),
        remote.sha,
        `Đồng bộ từ ${deps.device ?? "một máy"} — ${stamp}`,
        deps.doFetch,
      );
      await deps.writeBase(JSON.stringify(merged));

      return {
        data: merged,
        changed: !same(merged, deps.local),
        pushed: true,
        note: report ? describeMerge(report) : "Đã đưa dữ liệu máy này lên GitHub.",
        report,
      };
    } catch (cause) {
      // Máy kia ghi chen vào giữa lúc ta đang gộp: đọc lại rồi gộp lại từ đầu.
      if (cause instanceof GithubError && cause.conflict) {
        lastConflict = cause;
        continue;
      }
      throw cause;
    }
  }

  throw (
    lastConflict ??
    new GithubError("Thử mấy lần vẫn bị ghi chen. Bấm đồng bộ lại sau một lúc.", 409, true)
  );
}
