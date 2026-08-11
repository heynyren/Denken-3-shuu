/**
 * Xuất dữ liệu ra file Excel có bố cục giống file gốc,
 * để bạn luôn có bản sao đọc được mà không cần app.
 */

import ExcelJS from "exceljs";

import catalog from "../src/data/catalog.json";
import { SRS_INTERVALS, daysBetween, todayISO } from "../src/lib/srs";
import type { AppData, Catalog, CatalogItem, ItemProgress } from "../src/lib/types";

const CATALOG = catalog as unknown as Catalog;

const STATUS_LABEL: Record<string, string> = {
  correct: "✅ Đúng",
  relearned: "🔄 Sai → Đúng",
  wrong: "❌ Sai",
  todo: "⬜ Chưa làm",
};

const HEADERS = [
  "STT",
  "Chủ đề",
  "Tên bài tập",
  "Link",
  "Trạng thái",
  "Ghi chú",
  "Ngày làm bài",
  "Link tham khảo",
  "Cấp độ ôn",
  "Chu kỳ (ngày)",
  "Ngày ôn tiếp theo",
  "Còn lại (ngày)",
];

const WIDTHS = [6, 26, 62, 40, 15, 40, 14, 40, 10, 12, 16, 12];

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1F3B57" },
};

function styleHeaderRow(row: ExcelJS.Row): void {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = HEADER_FILL;
  row.alignment = { vertical: "middle" };
  row.height = 22;
}

function emptyProgress(): ItemProgress {
  return {
    status: "todo",
    notes: [],
    links: [],
    doneDate: null,
    srsLevel: 0,
    nextReview: null,
    history: [],
  };
}

function addSummarySheet(book: ExcelJS.Workbook, data: AppData): void {
  const sheet = book.addWorksheet("📊 KPI hàng ngày");
  sheet.columns = [{ width: 34 }, { width: 4 }, { width: 24 }];

  const today = todayISO();
  const log = data.dailyLog[today];
  const reviewed = log?.reviewed ?? 0;
  const goal = data.settings.dailyGoal;

  const counts = { correct: 0, relearned: 0, wrong: 0, todo: 0 };
  for (const item of CATALOG.items) {
    const status = data.progress[item.id]?.status ?? "todo";
    counts[status] += 1;
  }
  const attempted = CATALOG.items.length - counts.todo;

  const rows: Array<[string, string | number]> = [
    ["📅 Ngày hôm nay", today],
    ["🎯 Mục tiêu mỗi ngày (bài)", goal],
    ["✅ Đã làm hôm nay", reviewed],
    ["⏳ Còn thiếu để đạt KPI", Math.max(0, goal - reviewed)],
    ["", ""],
    ["📚 Tổng số bài", CATALOG.items.length],
    ["✅ Đã làm (có trạng thái)", attempted],
    ["⬜ Còn lại chưa làm", counts.todo],
    ["📈 % hoàn thành", attempted / CATALOG.items.length],
    ["", ""],
    ["✅ Đúng", counts.correct],
    ["🔄 Sai → Đúng", counts.relearned],
    ["❌ Sai", counts.wrong],
    ["", ""],
    ["📆 Ngày thi", data.settings.examDate],
    ["⏰ Còn lại (ngày)", daysBetween(today, data.settings.examDate)],
  ];

  const title = sheet.addRow(["📊 THEO DÕI KPI HÀNG NGÀY"]);
  title.font = { bold: true, size: 14 };
  sheet.addRow([]);

  for (const [label, value] of rows) {
    const row = sheet.addRow([label, "", value]);
    if (label) row.getCell(1).font = { bold: true };
    if (label === "📈 % hoàn thành") row.getCell(3).numFmt = "0.0%";
  }
}

function addSubjectSheet(
  book: ExcelJS.Workbook,
  sheetName: string,
  items: CatalogItem[],
  data: AppData,
): void {
  const sheet = book.addWorksheet(sheetName);
  sheet.columns = WIDTHS.map((width) => ({ width }));
  styleHeaderRow(sheet.addRow(HEADERS));
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const today = todayISO();

  items.forEach((item, index) => {
    const progress = data.progress[item.id] ?? emptyProgress();
    const cycle = progress.srsLevel > 0 ? SRS_INTERVALS[progress.srsLevel - 1] : "";

    const row = sheet.addRow([
      index + 1,
      item.topic,
      `${"★".repeat(item.stars)}${"☆".repeat(5 - item.stars)}《${
        CATALOG.subjects.find((s) => s.key === item.subject)?.name ?? ""
      }》〈${item.category}〉[${item.exam}:${item.question}]${item.name}`,
      item.url,
      STATUS_LABEL[progress.status] ?? "⬜ Chưa làm",
      // Nhiều ghi chú gộp lại thành một ô, ngăn bằng dòng kẻ cho dễ đọc.
      progress.notes
        .map((note) => {
          const files = note.attachments.map((a) => a.name).join(", ");
          return files ? `${note.text}\n[File: ${files}]` : note.text;
        })
        .join("\n────────\n"),
      progress.doneDate ?? "",
      progress.links
        .map((link) => (link.label ? `${link.label}: ${link.url}` : link.url))
        .join("\n"),
      progress.srsLevel || "",
      cycle ?? "",
      progress.nextReview ?? "",
      progress.nextReview ? daysBetween(today, progress.nextReview) : "",
    ]);

    // Link bấm được ngay trong Excel
    if (item.url) {
      row.getCell(4).value = { text: item.url, hyperlink: item.url };
      row.getCell(4).font = { color: { argb: "FF1155CC" }, underline: true };
    }
    // Chỉ bấm được khi có đúng một link; nhiều link thì để dạng chữ nhiều dòng.
    const onlyLink = progress.links.length === 1 ? progress.links[0]! : null;
    if (onlyLink && onlyLink.url.startsWith("http")) {
      row.getCell(8).value = { text: onlyLink.url, hyperlink: onlyLink.url };
      row.getCell(8).font = { color: { argb: "FF1155CC" }, underline: true };
    }
    row.getCell(6).alignment = { wrapText: true, vertical: "top" };
    row.getCell(8).alignment = { wrapText: true, vertical: "top" };
  });

  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: HEADERS.length } };
}

export async function writeWorkbook(filePath: string, data: AppData): Promise<void> {
  const book = new ExcelJS.Workbook();
  book.creator = "電験三種 — Sổ ôn thi";
  book.created = new Date();

  addSummarySheet(book, data);
  for (const subject of CATALOG.subjects) {
    const items = CATALOG.items.filter((item) => item.subject === subject.key);
    addSubjectSheet(book, subject.sheet, items, data);
  }

  await book.xlsx.writeFile(filePath);
}
