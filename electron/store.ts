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
import type {
  AppData,
  Attachment,
  DayLog,
  ExamAnswerRecord,
  ExamResult,
  ItemProgress,
  LinkEntry,
  NoteEntry,
} from "../src/lib/types";

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

function emptyProgress(): ItemProgress {
  return {
    status: "todo",
    notes: [],
    links: [],
    updatedAt: new Date().toISOString(),
    doneDate: null,
    srsLevel: 0,
    nextReview: null,
    history: [],
  };
}

/** id ổn định cho ghi chú/link sinh ra lúc chuyển đổi dữ liệu cũ. */
let counter = 0;
function newId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}

function cleanAttachments(input: unknown): Attachment[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((raw) => {
    if (typeof raw !== "object" || raw === null) return [];
    const entry = raw as Partial<Attachment>;
    // Không có tên file trên đĩa thì mô tả này vô dụng, bỏ đi.
    if (typeof entry.file !== "string" || !entry.file) return [];
    return [
      {
        id: entry.id ?? newId("att"),
        name: typeof entry.name === "string" ? entry.name : entry.file,
        file: entry.file,
        kind: entry.kind ?? "other",
        size: Number(entry.size) || 0,
        addedAt: entry.addedAt ?? new Date().toISOString(),
      },
    ];
  });
}

/**
 * Đọc phần ghi chú, chấp nhận cả dạng cũ (một chuỗi) lẫn dạng mới (danh sách).
 * Đây là toàn bộ đường di trú v2 -> v3 cho ghi chú.
 */
function cleanNotes(entry: Record<string, unknown>): NoteEntry[] {
  if (Array.isArray(entry.notes)) {
    return entry.notes.flatMap((raw) => {
      if (typeof raw !== "object" || raw === null) return [];
      const note = raw as Partial<NoteEntry>;
      const text = typeof note.text === "string" ? note.text : "";
      const attachments = cleanAttachments(note.attachments);
      // Ghi chú rỗng và không có file thì không giữ lại làm gì.
      if (!text.trim() && attachments.length === 0) return [];
      return [
        {
          id: note.id ?? newId("note"),
          text,
          createdAt: note.createdAt ?? new Date().toISOString(),
          attachments,
        },
      ];
    });
  }

  // Dạng cũ: một chuỗi ghi chú duy nhất.
  const legacy = typeof entry.note === "string" ? entry.note : "";
  if (!legacy.trim()) return [];
  return [
    {
      id: newId("note"),
      text: legacy,
      createdAt:
        typeof entry.doneDate === "string" ? entry.doneDate : new Date().toISOString(),
      attachments: [],
    },
  ];
}

/** Như trên, cho link tham khảo. */
function cleanLinks(entry: Record<string, unknown>): LinkEntry[] {
  if (Array.isArray(entry.links)) {
    return entry.links.flatMap((raw) => {
      if (typeof raw !== "object" || raw === null) return [];
      const link = raw as Partial<LinkEntry>;
      const url = typeof link.url === "string" ? link.url.trim() : "";
      if (!url) return [];
      return [
        {
          id: link.id ?? newId("link"),
          url,
          label: typeof link.label === "string" ? link.label : "",
        },
      ];
    });
  }

  const legacy = typeof entry.refLink === "string" ? entry.refLink.trim() : "";
  return legacy ? [{ id: newId("link"), url: legacy, label: "" }] : [];
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

/* ------------------------------------------------------------------ */
/* Kiểm tra và vá dữ liệu đọc từ đĩa                                   */
/* ------------------------------------------------------------------ */

/**
 * Nhận vào JSON bất kỳ, trả về AppData hợp lệ.
 * Thà giữ lại được phần lớn dữ liệu còn hơn từ chối cả file vì một trường lạ.
 */
function normalise(input: unknown): AppData {
  const base = buildFromSeed();
  if (typeof input !== "object" || input === null) return base;
  const raw = input as Partial<AppData>;

  const progress: Record<string, ItemProgress> = {};
  for (const [id, value] of Object.entries(raw.progress ?? {})) {
    if (typeof value !== "object" || value === null) continue;
    const entry = value as Record<string, unknown> & Partial<ItemProgress>;
    progress[id] = {
      status: entry.status ?? "todo",
      notes: cleanNotes(entry),
      links: cleanLinks(entry),
      updatedAt:
        typeof entry.updatedAt === "string" ? entry.updatedAt : new Date().toISOString(),
      doneDate: entry.doneDate ?? null,
      srsLevel: Number.isFinite(entry.srsLevel) ? Number(entry.srsLevel) : 0,
      nextReview: entry.nextReview ?? null,
      history: Array.isArray(entry.history) ? entry.history : [],
    };
  }

  const dailyLog: Record<string, DayLog> = {};
  for (const [day, value] of Object.entries(raw.dailyLog ?? {})) {
    if (typeof value !== "object" || value === null) continue;
    const entry = value as Partial<DayLog>;
    dailyLog[day] = {
      reviewed: Number(entry.reviewed) || 0,
      correct: Number(entry.correct) || 0,
      wrong: Number(entry.wrong) || 0,
      bySubject: entry.bySubject ?? {},
    };
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: raw.createdAt ?? base.createdAt,
    updatedAt: raw.updatedAt ?? base.updatedAt,
    settings: { ...DEFAULT_SETTINGS, ...(raw.settings ?? {}) },
    progress: Object.keys(progress).length > 0 ? progress : base.progress,
    dailyLog,
    badges: raw.badges ?? {},
    examResults: cleanExamResults(raw.examResults),
  };
}

/**
 * Lọc lịch sử thi thử về đúng hình dạng.
 *
 * Bài làm từng câu (`answers`) chỉ có ở lượt thi lưu từ v5 trở đi; lượt cũ giữ
 * nguyên phần điểm, chỉ là không có bảng phân tích chi tiết.
 */
function cleanExamResults(input: unknown): ExamResult[] {
  if (!Array.isArray(input)) return [];
  const out: ExamResult[] = [];

  for (const entry of input) {
    if (typeof entry !== "object" || entry === null) continue;
    const raw = entry as Partial<ExamResult>;
    if (typeof raw.id !== "string" || !Array.isArray(raw.scores)) continue;

    out.push({
      id: raw.id,
      exam: typeof raw.exam === "string" ? raw.exam : "",
      takenAt: typeof raw.takenAt === "string" ? raw.takenAt : new Date().toISOString(),
      scores: raw.scores.map((score) => {
        const answers = Array.isArray(score?.answers)
          ? score.answers
              .filter(
                (record): record is ExamAnswerRecord =>
                  typeof record?.id === "string" &&
                  Array.isArray(record.picked) &&
                  Array.isArray(record.truth),
              )
              .map((record) => ({
                id: record.id,
                picked: record.picked.map((value) =>
                  typeof value === "number" ? value : null,
                ),
                truth: record.truth.map((value) =>
                  typeof value === "number" ? value : null,
                ),
              }))
          : undefined;

        return {
          subject: score.subject,
          score: Number(score.score) || 0,
          correct: Number(score.correct) || 0,
          total: Number(score.total) || 0,
          passed: Boolean(score.passed),
          ...(answers ? { answers } : {}),
        };
      }),
    });
  }
  return out;
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
      return normalise(await readJson(path.join(paths.backupDir, name)));
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
    data = migrate(normalise(await readJson(paths.file)));
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

export { normalise };
