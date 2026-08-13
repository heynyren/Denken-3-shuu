/**
 * Nền tảng Android.
 *
 * Giữ đúng ba lớp bảo vệ dữ liệu như bản Windows, vì đó là cam kết xuyên suốt
 * dự án chứ không phải tính năng riêng của Windows:
 *
 *   1. Ghi nguyên tử   — ghi ra `.tmp` rồi mới đổi tên đè lên file thật.
 *   2. Sao lưu hằng ngày — mỗi ngày mở app giữ lại một bản trong `backups/`.
 *   3. Tự cứu hộ       — `data.json` hỏng thì lấy bản sao lưu mới nhất còn đọc
 *                        được, file hỏng cất sang `corrupt/` để soi lại.
 *
 * Dữ liệu nằm trong thư mục riêng của app (`Directory.Data`): gỡ app mới mất,
 * cập nhật app thì không đụng tới — giống hệt `%APPDATA%` bên Windows.
 */

import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Share } from "@capacitor/share";

import { emptyAppData } from "../lib/defaults";
import type { Attachment, AttachmentKind, OpResult } from "../lib/types";
import type { Platform } from "./types";
import { unsupported } from "./types";

const DIR = Directory.Data;
const FILE = "data.json";
const TMP = "data.json.tmp";
const BACKUPS = "backups";
const CORRUPT = "corrupt";
const ATTACHMENTS = "attachments";
const KEEP_BACKUPS = 30;
/** Chặn ảnh quá lớn, giống bản Windows. */
const MAX_FILE_BYTES = 25 * 1024 * 1024;

/* ------------------------------------------------------------------ */
/* Tiện ích file                                                       */
/* ------------------------------------------------------------------ */

async function ensureDir(path: string): Promise<void> {
  try {
    await Filesystem.mkdir({ path, directory: DIR, recursive: true });
  } catch {
    // Đã có sẵn thì mkdir ném lỗi — đúng như mong đợi, bỏ qua.
  }
}

async function readText(path: string): Promise<string | null> {
  try {
    const result = await Filesystem.readFile({
      path,
      directory: DIR,
      encoding: Encoding.UTF8,
    });
    return typeof result.data === "string" ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Ghi nguyên tử: ra file tạm trước, xong xuôi mới đổi tên đè lên file thật.
 * Hết pin giữa chừng thì cùng lắm mất file tạm, `data.json` vẫn nguyên vẹn.
 */
async function writeAtomic(path: string, text: string): Promise<void> {
  await Filesystem.writeFile({
    path: TMP,
    directory: DIR,
    data: text,
    encoding: Encoding.UTF8,
    recursive: true,
  });
  try {
    await Filesystem.deleteFile({ path, directory: DIR });
  } catch {
    // Lần ghi đầu tiên thì chưa có file để xoá.
  }
  await Filesystem.rename({ from: TMP, to: path, directory: DIR, toDirectory: DIR });
}

async function listDir(path: string): Promise<string[]> {
  try {
    const result = await Filesystem.readdir({ path, directory: DIR });
    return result.files.map((entry) => entry.name);
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Sao lưu và cứu hộ                                                   */
/* ------------------------------------------------------------------ */

const today = () => new Date().toISOString().slice(0, 10);

/** Mỗi ngày một bản, giữ 30 bản gần nhất. */
async function backupDaily(text: string): Promise<void> {
  await ensureDir(BACKUPS);
  const name = `${BACKUPS}/data-${today()}.json`;
  const names = await listDir(BACKUPS);
  if (names.includes(`data-${today()}.json`)) return;

  await Filesystem.writeFile({
    path: name,
    directory: DIR,
    data: text,
    encoding: Encoding.UTF8,
    recursive: true,
  });

  const old = names.filter((n) => n.endsWith(".json")).sort();
  for (const stale of old.slice(0, Math.max(0, old.length - KEEP_BACKUPS + 1))) {
    try {
      await Filesystem.deleteFile({ path: `${BACKUPS}/${stale}`, directory: DIR });
    } catch {
      // Xoá không được thì thôi, không đáng để hỏng cả lần ghi.
    }
  }
}

/** Bản sao lưu mới nhất còn đọc được. */
async function newestUsableBackup(): Promise<ReturnType<typeof emptyAppData> | null> {
  const names = (await listDir(BACKUPS))
    .filter((n) => n.endsWith(".json"))
    .sort()
    .reverse();
  for (const name of names) {
    const text = await readText(`${BACKUPS}/${name}`);
    if (!text) continue;
    try {
      return JSON.parse(text) as ReturnType<typeof emptyAppData>;
    } catch {
      continue; // bản này hỏng, thử bản cũ hơn
    }
  }
  return null;
}

/** Cất file hỏng sang `corrupt/` để còn soi lại, chứ không xoá thẳng. */
async function quarantine(text: string): Promise<void> {
  await ensureDir(CORRUPT);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  try {
    await Filesystem.writeFile({
      path: `${CORRUPT}/data-${stamp}.json`,
      directory: DIR,
      data: text,
      encoding: Encoding.UTF8,
      recursive: true,
    });
  } catch {
    // Cứu được dữ liệu quan trọng hơn là giữ được file hỏng.
  }
}

/* ------------------------------------------------------------------ */
/* Chuyển đổi nhị phân                                                 */
/* ------------------------------------------------------------------ */

export function bytesToBase64(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  let binary = "";
  // Cắt từng khúc: đẩy cả mảng vài chục MB vào String.fromCharCode là tràn stack.
  const CHUNK = 0x8000;
  for (let i = 0; i < view.length; i += CHUNK) {
    binary += String.fromCharCode(...view.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

const EXTENSION_KIND: Record<string, AttachmentKind> = {
  png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image",
  pdf: "pdf", doc: "docx", docx: "docx",
};

function kindOf(name: string): AttachmentKind {
  return EXTENSION_KIND[name.split(".").pop()?.toLowerCase() ?? ""] ?? "other";
}

const MIME: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", webp: "image/webp", pdf: "application/pdf",
};

/**
 * Tên file trong thư mục đính kèm — luôn là tên trơn, không có đường dẫn.
 * Chặn `../` ngay từ đây, đúng như `resolveSafe()` bên Windows.
 */
export function safeName(file: string): string | null {
  if (!file || file.includes("/") || file.includes("\\") || file.includes("..")) {
    return null;
  }
  return file;
}

let counter = 0;
function newFileName(original: string): string {
  const ext = original.includes(".") ? original.split(".").pop() : "bin";
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}.${ext}`;
}

/* ------------------------------------------------------------------ */
/* Chia sẻ file ra ngoài                                               */
/* ------------------------------------------------------------------ */

/**
 * Android không có hộp thoại "lưu file vào đâu" như Windows. Cách tương đương
 * là ghi ra thư mục tạm rồi mở khay chia sẻ, để người dùng tự chọn gửi đi đâu —
 * Drive, Gmail, Files, tuỳ họ.
 */
async function shareText(name: string, text: string, title: string): Promise<OpResult> {
  try {
    await Filesystem.writeFile({
      path: name,
      directory: Directory.Cache,
      data: text,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    const { uri } = await Filesystem.getUri({ path: name, directory: Directory.Cache });
    await Share.share({ title, url: uri });
    return { ok: true, path: uri };
  } catch (cause) {
    const message = (cause as Error).message ?? String(cause);
    // Người dùng đóng khay chia sẻ không phải là lỗi.
    if (/cancel/i.test(message)) return { ok: false, cancelled: true };
    return { ok: false, error: message };
  }
}

/* ------------------------------------------------------------------ */
/* Nền tảng                                                            */
/* ------------------------------------------------------------------ */

export const android: Platform = {
  kind: "android",
  can: {
    // Đọc Excel cần exceljs chạy ngay trong webview và một bộ chọn file riêng.
    // Bản đầu chưa làm: nhập trên máy tính rồi đồng bộ sang là đủ.
    excelImport: false,
    excelExport: false,
    // Android không có thư mục Google Drive gắn sẵn trên đĩa để chép vào.
    // Việc của nó là đồng bộ qua Drive API, không phải nhân bản thư mục.
    mirrorFolder: false,
    revealFolder: false,
    attachments: true,
    mergeFile: true,
  },

  async load() {
    await ensureDir(ATTACHMENTS);
    const text = await readText(FILE);

    // Lần chạy đầu: chưa có file thì mở sổ trắng.
    if (text === null) return emptyAppData();

    try {
      const data = JSON.parse(text) as ReturnType<typeof emptyAppData>;
      await backupDaily(text);
      return data;
    } catch {
      // data.json hỏng — cứu từ bản sao lưu mới nhất còn đọc được.
      await quarantine(text);
      return (await newestUsableBackup()) ?? emptyAppData();
    }
  },

  async save(data) {
    try {
      await writeAtomic(FILE, JSON.stringify(data));
      return { ok: true, path: FILE };
    } catch (cause) {
      return { ok: false, error: (cause as Error).message };
    }
  },

  async info() {
    const { uri } = await Filesystem.getUri({ path: FILE, directory: DIR });
    const version = await App.getInfo()
      .then((entry) => entry.version)
      .catch(() => "");
    return {
      dataFile: uri,
      dataDir: uri.replace(/\/[^/]+$/, ""),
      backupDir: uri.replace(/\/[^/]+$/, `/${BACKUPS}`),
      appVersion: version,
      backupCount: (await listDir(BACKUPS)).filter((n) => n.endsWith(".json")).length,
    };
  },

  async exportJson() {
    const text = await readText(FILE);
    if (text === null) return { ok: false, error: "Chưa có dữ liệu để xuất." };
    return shareText(`denken-${today()}.json`, text, "Sao lưu sổ ôn thi");
  },

  async exportXlsx() {
    return unsupported("Xuất ra Excel");
  },

  async exportZip() {
    // Gói .zip cần nén cả thư mục đính kèm; bản đầu chưa làm.
    // Xuất JSON vẫn giữ được toàn bộ tiến độ, ghi chú và link tham khảo.
    return unsupported("Xuất gói .zip");
  },

  async importJson() {
    return unsupported("Nhập từ file JSON");
  },

  async importXlsx() {
    return unsupported("Nhập từ file Excel");
  },

  async revealDataFolder() {
    return unsupported("Mở thư mục dữ liệu");
  },

  async pickMirrorDir() {
    return unsupported("Chọn thư mục nhân bản");
  },

  async mirrorNow() {
    return unsupported("Nhân bản thư mục");
  },

  async pickJsonText() {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json,.json";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return resolve({ ok: false, cancelled: true });
        try {
          resolve({ ok: true, text: await file.text(), path: file.name });
        } catch (cause) {
          resolve({ ok: false, error: (cause as Error).message });
        }
      };
      input.click();
    });
  },

  async openExternal(url) {
    if (!/^https?:\/\//i.test(url)) return { ok: false, error: "Link không hợp lệ." };
    await Browser.open({ url });
    return { ok: true };
  },

  async notifyAt(id, at, title, body) {
    if (at - Date.now() <= 0) return { ok: false, error: "Mốc giờ đã qua." };
    try {
      // Android 13 trở lên phải xin quyền thông báo; hỏi ngay lần hẹn đầu tiên.
      let allowed = (await LocalNotifications.checkPermissions()).display;
      if (allowed !== "granted") {
        allowed = (await LocalNotifications.requestPermissions()).display;
      }
      if (allowed !== "granted") {
        return { ok: false, error: "Bạn chưa cho app gửi thông báo." };
      }

      await LocalNotifications.cancel({ notifications: [{ id }] });
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body,
            // `allowWhileIdle` để lời nhắc vẫn nổ khi máy đã ngủ sâu (Doze).
            schedule: { at: new Date(at), allowWhileIdle: true },
            ongoing: false,
          },
        ],
      });
      return { ok: true };
    } catch (cause) {
      return { ok: false, error: (cause as Error).message };
    }
  },

  async cancelNotify(id) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id }] });
      return { ok: true };
    } catch (cause) {
      return { ok: false, error: (cause as Error).message };
    }
  },

  async attachPick() {
    // Dùng luôn bộ chọn file của WebView, không cần thêm plugin nào.
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.onchange = async () => {
        const files = [...(input.files ?? [])];
        if (files.length === 0) return resolve({ ok: false, cancelled: true });

        const saved: Attachment[] = [];
        for (const file of files) {
          const result = await android.attachSave(file.name, await file.arrayBuffer());
          if (result.ok && result.attachment) saved.push(result.attachment);
        }
        resolve({ ok: saved.length > 0, attachments: saved });
      };
      input.click();
    });
  },

  async attachSave(name, bytes) {
    if (bytes.byteLength > MAX_FILE_BYTES) {
      return { ok: false, error: "File lớn hơn 25 MB." };
    }
    try {
      await ensureDir(ATTACHMENTS);
      const file = newFileName(name);
      await Filesystem.writeFile({
        path: `${ATTACHMENTS}/${file}`,
        directory: DIR,
        data: bytesToBase64(bytes),
        recursive: true,
      });
      return {
        ok: true,
        attachment: {
          id: `att-${file}`,
          name,
          file,
          kind: kindOf(name),
          size: bytes.byteLength,
          addedAt: new Date().toISOString(),
        },
      };
    } catch (cause) {
      return { ok: false, error: (cause as Error).message };
    }
  },

  async attachDataUrl(file) {
    const safe = safeName(file);
    if (!safe) return { ok: false, error: "Tên file không hợp lệ." };
    try {
      const result = await Filesystem.readFile({
        path: `${ATTACHMENTS}/${safe}`,
        directory: DIR,
      });
      const mime = MIME[safe.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";
      return { ok: true, dataUrl: `data:${mime};base64,${result.data as string}` };
    } catch (cause) {
      return { ok: false, error: (cause as Error).message };
    }
  },

  async attachOpen(file) {
    const safe = safeName(file);
    if (!safe) return { ok: false, error: "Tên file không hợp lệ." };
    try {
      const { uri } = await Filesystem.getUri({
        path: `${ATTACHMENTS}/${safe}`,
        directory: DIR,
      });
      await Share.share({ url: uri });
      return { ok: true };
    } catch (cause) {
      return { ok: false, error: (cause as Error).message };
    }
  },

  async attachDelete(file) {
    const safe = safeName(file);
    if (!safe) return { ok: false, error: "Tên file không hợp lệ." };
    try {
      await Filesystem.deleteFile({ path: `${ATTACHMENTS}/${safe}`, directory: DIR });
      return { ok: true };
    } catch (cause) {
      return { ok: false, error: (cause as Error).message };
    }
  },
};
