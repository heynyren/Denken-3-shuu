/**
 * Kho dữ liệu người dùng.
 *
 * Vì sao cập nhật app không làm mất dữ liệu
 * ------------------------------------------
 * Bản cài đặt và dữ liệu nằm ở HAI thư mục hoàn toàn tách biệt:
 *
 *   Code   C:\Users\<ban>\AppData\Local\Programs\denken-3-shuu\    <- installer ghi đè
 *   Dữ liệu C:\Users\<ban>\AppData\Roaming\denken-3-shuu\data.json  <- không ai đụng tới
 *
 * `app.getPath("userData")` trả về thư mục thứ hai. Trình cài đặt chỉ thay
 * thư mục thứ nhất, nên gỡ app rồi cài lại vẫn còn nguyên dữ liệu.
 *
 * Ba lớp bảo vệ thêm:
 *   1. Ghi nguyên tử  — ghi ra file .tmp rồi mới đổi tên đè lên file thật,
 *                       nên mất điện giữa chừng cũng không để lại file hỏng.
 *   2. Sao lưu hằng ngày — mỗi ngày mở app giữ lại một bản, mặc định giữ 30 bản.
 *   3. Cứu hộ tự động — nếu data.json hỏng, tự lấy bản sao lưu mới nhất.
 */

import { app } from "electron";
import { promises as fs } from "node:fs";
import path from "node:path";

import seed from "../src/data/seed.json";
import { DEFAULT_SETTINGS, SCHEMA_VERSION } from "../src/lib/defaults";
import { emptyProgress, normalise as normaliseData } from "../src/lib/normalise";
import type { AppData, ItemProgress } from "../src/lib/types";

// Phiên bản schema và bộ cài đặt mặc định nằm ở src/lib/defaults.ts để Android
// dùng chung — hai bản chép tay sẽ lệch nhau, mà lệch schema là hỏng di trú.
export { SCHEMA_VERSION };

export const paths = {
  get dir() {
    return app.getPath("userData");
  },
  get file() {
    return path.join(app.getPath("userData"), "data.json");
  },
  get backupDir() {
    return path.join(app.getPath("userData"), "backups");
  },
  get corruptDir() {
    return path.join(app.getPath("userData"), "corrupt");
  },
};

function today(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/* ------------------------------------------------------------------ */
/* Dựng dữ liệu ban đầu từ seed.json (chỉ chạy đúng một lần)           */
/* ------------------------------------------------------------------ */

interface SeedShape {
  progress: Record<string, Partial<ItemProgress>>;
}

function buildFromSeed(): AppData {
  const raw = seed as unknown as SeedShape;
  const progress: Record<string, ItemProgress> = {};

  for (const [id, partial] of Object.entries(raw.progress ?? {})) {
    progress[id] = { ...emptyProgress(), ...partial };
  }

  const now = new Date().toISOString();
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    settings: { ...DEFAULT_SETTINGS },
    progress,
    dailyLog: {},
    badges: {},
    examResults: [],
  };
}

/**
 * Nắn JSON bất kỳ về AppData, lấy sổ dựng từ seed.json làm chỗ dựa.
 * Ruột nằm ở src/lib/normalise.ts để Android dùng chung.
 */
export function normalise(input: unknown): AppData {
  return normaliseData(input, buildFromSeed());
}

/**
 * Nâng cấp dữ liệu cũ lên schema hiện tại.
 * Mỗi lần đổi cấu trúc thì tăng SCHEMA_VERSION và thêm một nhánh ở đây,
 * không bao giờ xoá dữ liệu cũ.
 */
function migrate(data: AppData): AppData {
  // normalise() đã lo trọn các bước chuyển đổi:
  //   v1 -> v2  lược bỏ decks/vocab
  //   v2 -> v3  đổi note/refLink dạng chuỗi thành notes[]/links[]
  //   v4 -> v5  lượt thi cũ không có scores[].answers, để trống là đúng —
  //             không dựng lại được bài làm từ điểm số, và cũng không nên đoán.
  //   v5 -> v6  thêm progress[].starred, sổ cũ mặc định chưa đánh dấu sao.
  return data;
}

/** Tên mọi file đính kèm còn được nhắc tới, để dọn file mồ côi. */
export function referencedFiles(data: AppData): Set<string> {
  const names = new Set<string>();
  for (const entry of Object.values(data.progress)) {
    for (const note of entry.notes) {
      for (const attachment of note.attachments) names.add(attachment.file);
    }
  }
  return names;
}

/* ------------------------------------------------------------------ */
/* Đọc / ghi                                                           */
/* ------------------------------------------------------------------ */

async function readJson(file: string): Promise<unknown> {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

/** Bản sao lưu mới nhất còn đọc được, nếu có. */
async function newestUsableBackup(): Promise<AppData | null> {
  let names: string[];
  try {
    names = await fs.readdir(paths.backupDir);
  } catch {
    return null;
  }

  const candidates = names.filter((n) => n.endsWith(".json")).sort().reverse();
  for (const name of candidates) {
    try {
      return normaliseData(
        await readJson(path.join(paths.backupDir, name)),
        buildFromSeed(),
      );
    } catch {
      continue; // bản này hỏng, thử bản cũ hơn
    }
  }
  return null;
}

/** Cất file hỏng sang thư mục riêng thay vì ghi đè lên nó. */
async function quarantine(file: string): Promise<void> {
  try {
    await fs.mkdir(paths.corruptDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await fs.rename(file, path.join(paths.corruptDir, `data-${stamp}.json`));
  } catch {
    // Không cứu được thì thôi, không để việc này chặn app khởi động.
  }
}

export async function load(): Promise<AppData> {
  await fs.mkdir(paths.dir, { recursive: true });

  let data: AppData;
  try {
    data = migrate(normaliseData(await readJson(paths.file), buildFromSeed()));
  } catch (error) {
    const missing = (error as NodeJS.ErrnoException).code === "ENOENT";
    if (missing) {
      // Lần chạy đầu tiên: đổ dữ liệu từ Excel đã chuyển sẵn.
      data = buildFromSeed();
      await save(data);
      return data;
    }
    // File tồn tại nhưng hỏng: cứu từ bản sao lưu, giữ lại file hỏng để soi sau.
    const rescued = await newestUsableBackup();
    await quarantine(paths.file);
    data = rescued ?? buildFromSeed();
    await save(data);
    return data;
  }

  await backupDaily(data);
  return data;
}

export async function save(data: AppData): Promise<void> {
  await fs.mkdir(paths.dir, { recursive: true });
  const payload = JSON.stringify(
    { ...data, schemaVersion: SCHEMA_VERSION, updatedAt: new Date().toISOString() },
    null,
    0,
  );

  // Ghi nguyên tử: file tạm -> fsync -> đổi tên. Đổi tên trong cùng ổ đĩa là
  // thao tác không thể đứt quãng, nên data.json luôn ở trạng thái đọc được.
  const tmp = `${paths.file}.tmp`;
  const handle = await fs.open(tmp, "w");
  try {
    await handle.writeFile(payload, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  await fs.rename(tmp, paths.file);
}

/* ------------------------------------------------------------------ */
/* Sao lưu                                                             */
/* ------------------------------------------------------------------ */

async function backupDaily(data: AppData): Promise<void> {
  try {
    await fs.mkdir(paths.backupDir, { recursive: true });
    const target = path.join(paths.backupDir, `data-${today()}.json`);

    // Mỗi ngày một bản, bản đầu tiên trong ngày là ảnh chụp trước khi học.
    try {
      await fs.access(target);
      return;
    } catch {
      // chưa có bản của hôm nay
    }

    await fs.writeFile(target, JSON.stringify(data), "utf8");
    await pruneBackups(data.settings.backupsToKeep);
  } catch {
    // Sao lưu hỏng thì vẫn cho app chạy tiếp; không được chặn người dùng học.
  }
}

async function pruneBackups(keep: number): Promise<void> {
  const names = (await fs.readdir(paths.backupDir))
    .filter((n) => /^data-\d{4}-\d{2}-\d{2}\.json$/.test(n))
    .sort();
  const excess = names.slice(0, Math.max(0, names.length - Math.max(1, keep)));
  await Promise.all(
    excess.map((n) => fs.rm(path.join(paths.backupDir, n), { force: true })),
  );
}

export async function countBackups(): Promise<number> {
  try {
    const names = await fs.readdir(paths.backupDir);
    return names.filter((n) => n.endsWith(".json")).length;
  } catch {
    return 0;
  }
}

