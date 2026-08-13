/**
 * Nhận vào JSON bất kỳ, trả về AppData hợp lệ.
 *
 * Thà giữ lại được phần lớn dữ liệu còn hơn từ chối cả file vì một trường lạ.
 * Đây cũng là toàn bộ đường di trú schema: v1 bỏ decks/vocab, v2→v3 đổi
 * note/refLink dạng chuỗi thành notes[]/links[], v4→v5 lượt thi cũ không có
 * `scores[].answers` thì để trống — không dựng lại được bài làm từ điểm số, và
 * cũng không nên đoán.
 *
 * Nằm ở src/lib/ chứ không ở electron/store.ts vì có ba nơi cần dùng: kho dữ
 * liệu trên Windows, kho dữ liệu trên Android, và lúc gộp file sao lưu của máy
 * khác ngay trong giao diện. Ba bản chép tay sẽ lệch nhau, mà lệch ở đây là
 * hỏng dữ liệu.
 */

import { DEFAULT_SETTINGS, SCHEMA_VERSION } from "./defaults";
import type {
  AppData,
  Attachment,
  DayLog,
  ExamAnswerRecord,
  ExamResult,
  ItemProgress,
  LinkEntry,
  NoteEntry,
} from "./types";

export function emptyProgress(): ItemProgress {
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
 * @param fallback Sổ trống dùng khi file thiếu hẳn phần nào đó. Trên Windows là
 *   sổ dựng từ seed.json, trên Android và lúc gộp file là sổ trắng.
 */
export function normalise(input: unknown, fallback: AppData): AppData {
  if (typeof input !== "object" || input === null) return fallback;
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
    createdAt: raw.createdAt ?? fallback.createdAt,
    updatedAt: raw.updatedAt ?? fallback.updatedAt,
    settings: { ...DEFAULT_SETTINGS, ...(raw.settings ?? {}) },
    progress: Object.keys(progress).length > 0 ? progress : fallback.progress,
    dailyLog,
    badges: raw.badges ?? {},
    examResults: cleanExamResults(raw.examResults),
  };
}

/**
 * Đọc một file sao lưu người ta gửi sang: kiểm tra sơ bộ rồi nắn về AppData.
 * Trả về `null` kèm lý do nếu đó không phải sổ ôn thi.
 */
export function parseBackup(
  text: string,
  fallback: AppData,
): { data: AppData } | { error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { error: "File này không phải JSON đọc được." };
  }
  if (typeof raw !== "object" || raw === null) {
    return { error: "File này không phải bản sao lưu của app." };
  }
  const shape = raw as Partial<AppData>;
  // Sổ nào cũng có hai thứ này; thiếu cả hai thì gần như chắc chắn là file khác.
  if (typeof shape.progress !== "object" || shape.progress === null) {
    return { error: "File này không có phần tiến độ — không phải sổ ôn thi." };
  }
  return { data: normalise(raw, fallback) };
}
