/**
 * Ôn tập giãn cách (spaced repetition) — giữ đúng chu kỳ trong file Excel gốc.
 *
 * Làm đúng  -> lên một cấp, hẹn ôn lại xa hơn: 1 → 3 → 7 → 14 → 30 → 90 ngày.
 * Làm sai   -> về cấp 1, mai ôn lại.
 *
 * Mọi ngày tháng đều là chuỗi "YYYY-MM-DD" theo giờ máy, không dùng UTC,
 * vì "hôm nay" với người học là ngày trên lịch treo tường chứ không phải mốc UTC.
 */

import type { ItemProgress, ItemStatus } from "./types";

export const SRS_INTERVALS = [1, 3, 7, 14, 30, 90] as const;
export const MAX_LEVEL = SRS_INTERVALS.length;

const MS_PER_DAY = 86_400_000;

export function todayISO(): string {
  return toISO(new Date());
}

export function toISO(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Đọc "YYYY-MM-DD" thành Date lúc 0h giờ máy (tránh lệch múi giờ của Date.parse). */
export function fromISO(iso: string): Date {
  const [year = 1970, month = 1, day = 1] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(iso: string, days: number): string {
  const date = fromISO(iso);
  date.setDate(date.getDate() + days);
  return toISO(date);
}

/** Số ngày từ `from` đến `to`. Dương = `to` ở tương lai. */
export function daysBetween(from: string, to: string): number {
  return Math.round((fromISO(to).getTime() - fromISO(from).getTime()) / MS_PER_DAY);
}

export function emptyProgress(): ItemProgress {
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

/** Bài đã đến hạn ôn (kể cả quá hạn). Bài chưa từng làm không tính là đến hạn. */
export function isDue(progress: ItemProgress | undefined, today: string): boolean {
  if (!progress?.nextReview) return false;
  return daysBetween(today, progress.nextReview) <= 0;
}

/** Số ngày quá hạn; 0 nghĩa là đúng hạn hôm nay. */
export function overdueDays(progress: ItemProgress | undefined, today: string): number {
  if (!progress?.nextReview) return 0;
  return Math.max(0, -daysBetween(today, progress.nextReview));
}

/**
 * Trạng thái mới sau khi chấm một lần ôn.
 * Giữ nguyên quy ước của Excel: đã từng sai mà nay làm đúng thì là "Sai → Đúng",
 * để bạn nhìn ra ngay đâu là chỗ từng vấp.
 */
function nextStatus(current: ItemStatus, result: "correct" | "wrong"): ItemStatus {
  if (result === "wrong") return "wrong";
  return current === "wrong" || current === "relearned" ? "relearned" : "correct";
}

/** Ghi nhận kết quả một lần ôn, trả về bản tiến độ mới (không sửa bản cũ). */
export function applyReview(
  current: ItemProgress | undefined,
  result: "correct" | "wrong",
  today: string = todayISO(),
): ItemProgress {
  const base = current ?? emptyProgress();
  const level =
    result === "correct" ? Math.min(base.srsLevel + 1, MAX_LEVEL) : 1;
  const interval = SRS_INTERVALS[level - 1] ?? 1;

  return {
    ...base,
    status: nextStatus(base.status, result),
    srsLevel: level,
    doneDate: today,
    nextReview: addDays(today, interval),
    // Giữ 50 lần gần nhất là đủ vẽ biểu đồ mà không phình file.
    history: [...base.history, { date: today, result, level }].slice(-50),
  };
}

/** Nhãn tiếng Việt cho chu kỳ hiện tại, ví dụ "Cấp 3 · 7 ngày". */
export function levelLabel(level: number): string {
  if (level <= 0) return "Chưa vào chu kỳ";
  const interval = SRS_INTERVALS[Math.min(level, MAX_LEVEL) - 1];
  return `Cấp ${level} · ${interval} ngày`;
}
