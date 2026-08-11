/**
 * Thời gian làm bài.
 *
 * Đề 電験三種 chia hai loại câu:
 *   A問題 — một ý, tính 5 phút một câu
 *   B問題 — hai ý, tính 10 phút một câu
 *
 * Số hiệu câu nào là B問題 thì mỗi môn một khác, nên phải tra theo môn:
 *
 *   理論 / 機械   問15, 16, 17, 18
 *   電力         問15, 16, 17
 *   法規         問11, 12, 13
 */

import type { CatalogItem, SubjectKey } from "./types";

export const MINUTES_A = 5;
export const MINUTES_B = 10;

/** Số hiệu các câu B問題 của từng môn. */
const B_QUESTIONS: Record<SubjectKey, ReadonlySet<number>> = {
  riron: new Set([15, 16, 17, 18]),
  kikai: new Set([15, 16, 17, 18]),
  denryoku: new Set([15, 16, 17]),
  houki: new Set([11, 12, 13]),
};

/**
 * Rút số hiệu câu từ chuỗi dạng "問17".
 * Trả về null khi không đọc được, để bên gọi tự quyết định cách xử lý.
 */
export function questionNumber(item: CatalogItem): number | null {
  const match = /(\d+)/.exec(item.question);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

export function isPartB(item: CatalogItem): boolean {
  const number = questionNumber(item);
  if (number === null) return false;
  return B_QUESTIONS[item.subject]?.has(number) ?? false;
}

/** Số phút được tính cho một bài. */
export function minutesFor(item: CatalogItem): number {
  return isPartB(item) ? MINUTES_B : MINUTES_A;
}

export function secondsFor(item: CatalogItem): number {
  return minutesFor(item) * 60;
}

/** Nhãn ngắn để hiện cạnh đồng hồ, ví dụ "B問題 · 10 phút". */
export function partLabel(item: CatalogItem): string {
  return isPartB(item)
    ? `B問題 · ${MINUTES_B} phút`
    : `A問題 · ${MINUTES_A} phút`;
}

/** 125 giây -> "2:05" */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
