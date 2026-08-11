/**
 * Nhập tiến độ từ file Excel "Bài tập điện hạng 3 — Tổng hợp".
 *
 * Đây là cách bạn đưa dữ liệu riêng của mình vào app: ghi chú, link tham khảo,
 * trạng thái, lịch ôn. App không kèm sẵn phần này vì nó là dữ liệu cá nhân,
 * không phải thứ nên nằm trong bản cài đặt.
 *
 * Ghép theo `id` sinh từ link denken-ou.com — cùng cách mà scripts/convert-excel.py
 * sinh ra catalog.json, nên bài nào trong Excel khớp bài nấy trong app.
 */

import ExcelJS from "exceljs";

import catalog from "../src/data/catalog.json";
import { SRS_INTERVALS, emptyProgress } from "../src/lib/srs";
import type {
  AppData,
  Catalog,
  ImportReport,
  ItemProgress,
  ItemStatus,
} from "../src/lib/types";

export type { ImportReport };

const CATALOG = catalog as unknown as Catalog;

/** Cột trong các sheet môn học (đánh số từ 1 theo quy ước của ExcelJS). */
const COL = {
  no: 1,
  topic: 2,
  title: 3,
  url: 4,
  status: 5,
  note: 6,
  doneDate: 7,
  refLink: 8,
  cycle: 10,
  nextReview: 11,
} as const;

const STATUS_MAP: Record<string, ItemStatus> = {
  "✅ Đúng": "correct",
  "🔄 Sai → Đúng": "relearned",
  "❌ Sai": "wrong",
  "⬜ Chưa làm": "todo",
};

/* ------------------------------------------------------------------ */
/* Đọc ô                                                               */
/* ------------------------------------------------------------------ */

/** Ô Excel có thể là chuỗi, số, công thức, hoặc rich text — quy hết về chuỗi. */
function text(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return isoDate(value);

  const rich = value as {
    richText?: Array<{ text: string }>;
    text?: string;
    result?: unknown;
    error?: string;
  };
  // Ô lỗi công thức (#VALUE!, #REF!…) là công thức hỏng, không phải nội dung
  // người dùng gõ — trả về rỗng để không nhập rác vào ghi chú.
  if (typeof rich.error === "string") return "";
  if (Array.isArray(rich.richText)) {
    return rich.richText.map((part) => part.text).join("").trim();
  }
  if (typeof rich.text === "string") return rich.text.trim();
  if (rich.result !== undefined) return text(rich.result as ExcelJS.CellValue);
  return "";
}

function isoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Đọc một ô ngày.
 *
 * Không phải ô nào cũng là kiểu ngày của Excel: nhiều ô được gõ tay thành chuỗi
 * "16/6/2026". Bỏ qua những ô đó là mất ngày làm bài của gần trăm bài.
 * Quy ước ngày/tháng/năm theo kiểu Việt Nam, khớp với dữ liệu trong file.
 */
function dateCell(value: ExcelJS.CellValue): string | null {
  if (value instanceof Date) return isoDate(value);

  const raw = text(value);
  if (!raw) return null;

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (iso) return iso[0]!;

  const slashed = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (slashed) {
    let day = Number(slashed[1]);
    let month = Number(slashed[2]);
    // Nếu vế đầu quá 12 thì chắc chắn là ngày; nếu vế sau quá 12 thì file đó
    // đang ghi kiểu tháng/ngày, đảo lại cho đúng.
    if (month > 12 && day <= 12) [day, month] = [month, day];
    if (day < 1 || day > 31 || month < 1 || month > 12) return null;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${slashed[3]}-${pad(month)}-${pad(day)}`;
  }

  return null;
}

function slugFromUrl(url: string): string {
  return url
    .replace(/^https?:\/\/[^/]+\/?/, "")
    .split(/[?#]/)[0]!
    .replace(/\/+$/, "")
    .toLowerCase();
}

/** Đổi "Chu kỳ (ngày)" thành cấp độ ôn 0..6. */
function cycleToLevel(value: ExcelJS.CellValue): number {
  const days = Number(text(value));
  if (!Number.isFinite(days) || days <= 0) return 0;
  const exact = SRS_INTERVALS.indexOf(days as (typeof SRS_INTERVALS)[number]);
  if (exact >= 0) return exact + 1;
  let level = 0;
  SRS_INTERVALS.forEach((interval, index) => {
    if (days >= interval) level = index + 1;
  });
  return level;
}

/* ------------------------------------------------------------------ */
/* Nhập                                                                */
/* ------------------------------------------------------------------ */

export async function importWorkbook(
  filePath: string,
  current: AppData,
): Promise<{ data: AppData; report: ImportReport }> {
  const book = new ExcelJS.Workbook();
  await book.xlsx.readFile(filePath);

  const progress: Record<string, ItemProgress> = { ...current.progress };
  const report: ImportReport = {
    matched: 0,
    unmatched: 0,
    notes: 0,
    refLinks: 0,
    scheduled: 0,
    samples: [],
  };

  for (const subject of CATALOG.subjects) {
    const sheet = book.getWorksheet(subject.sheet);
    if (!sheet) continue;

    // Đếm số lần gặp mỗi slug để khớp đúng hậu tố ~2 của bài liên môn.
    const seen = new Map<string, number>();

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber < 3) return; // 2 dòng đầu là tiêu đề
      const no = text(row.getCell(COL.no).value);
      if (!no) return;

      const url = text(row.getCell(COL.url).value);
      const slug = url ? slugFromUrl(url) : `no-link-${no}`;
      const base = `${subject.key}:${slug}`;
      const count = (seen.get(base) ?? 0) + 1;
      seen.set(base, count);
      const id = count === 1 ? base : `${base}~${count}`;

      if (!CATALOG.items.some((item) => item.id === id)) {
        report.unmatched += 1;
        if (report.samples.length < 5) {
          report.samples.push(text(row.getCell(COL.title).value).slice(0, 60));
        }
        return;
      }

      const note = text(row.getCell(COL.note).value);
      const refLink = text(row.getCell(COL.refLink).value);
      const nextReview = dateCell(row.getCell(COL.nextReview).value);

      progress[id] = {
        ...emptyProgress(),
        ...progress[id],
        status: STATUS_MAP[text(row.getCell(COL.status).value)] ?? "todo",
        note,
        refLink,
        doneDate: dateCell(row.getCell(COL.doneDate).value),
        srsLevel: cycleToLevel(row.getCell(COL.cycle).value),
        nextReview,
      };

      report.matched += 1;
      if (note) report.notes += 1;
      if (refLink) report.refLinks += 1;
      if (nextReview) report.scheduled += 1;
    });
  }

  return { data: { ...current, progress }, report };
}
