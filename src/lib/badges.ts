/**
 * Huy hiệu — phần thưởng cho những mốc đáng nhớ.
 *
 * Mỗi huy hiệu là một điều kiện tính từ dữ liệu hiện tại. Ngày đạt được lưu
 * trong data.badges để về sau nhìn lại biết mình vượt mốc đó lúc nào.
 * Đã đạt rồi thì không bao giờ mất, kể cả khi số liệu tụt xuống.
 */

import type { Overview } from "./stats";
import type { AppData } from "./types";

export interface Badge {
  id: string;
  icon: string;
  name: string;
  description: string;
  /** Đã đạt hay chưa, tính từ số liệu hiện tại. */
  earned: (view: Overview, data: AppData) => boolean;
  /** Tiến độ tới mốc, 0..1 — để vẽ huy hiệu chưa mở khoá cho có động lực. */
  progress: (view: Overview, data: AppData) => number;
}

const ratio = (value: number, target: number) =>
  Math.max(0, Math.min(1, value / target));

function milestone(
  id: string,
  icon: string,
  name: string,
  description: string,
  target: number,
  value: (view: Overview, data: AppData) => number,
): Badge {
  return {
    id,
    icon,
    name,
    description,
    earned: (view, data) => value(view, data) >= target,
    progress: (view, data) => ratio(value(view, data), target),
  };
}

/** Số bài từng sai rồi sửa được thành đúng. */
function comebacks(data: AppData): number {
  let count = 0;
  for (const entry of Object.values(data.progress)) {
    if (entry.status === "relearned") count += 1;
  }
  return count;
}

/** Số bài đang nằm trong chu kỳ ôn (đã có ngày ôn lại). */
function scheduledCount(data: AppData): number {
  let count = 0;
  for (const entry of Object.values(data.progress)) {
    if (entry.nextReview) count += 1;
  }
  return count;
}

/** Dưới mức này thì chưa coi là đang chạy một lịch ôn thực sự. */
const SCHEDULED_FLOOR = 20;

/** Tổng số lần ôn đã ghi nhận từ trước tới nay. */
function totalReviews(data: AppData): number {
  let count = 0;
  for (const day of Object.values(data.dailyLog)) count += day.reviewed;
  return count;
}

export const BADGES: Badge[] = [
  milestone(
    "start",
    "🌱",
    "Khởi hành",
    "Hoàn thành bài ôn đầu tiên trong app",
    1,
    (_view, data) => totalReviews(data),
  ),
  milestone(
    "goal-day",
    "🎯",
    "Đúng hẹn",
    "Đạt mục tiêu ngày lần đầu tiên",
    1,
    (view, data) =>
      Object.values(data.dailyLog).filter(
        (day) => day.reviewed >= view.today.goal,
      ).length,
  ),
  milestone("streak-3", "🔥", "Ba ngày liền", "Giữ chuỗi 3 ngày liên tiếp", 3,
    (view) => Math.max(view.streak.current, view.streak.longest)),
  milestone("streak-7", "🔥", "Trọn một tuần", "Giữ chuỗi 7 ngày liên tiếp", 7,
    (view) => Math.max(view.streak.current, view.streak.longest)),
  milestone("streak-30", "🏔️", "Một tháng bền bỉ", "Giữ chuỗi 30 ngày liên tiếp", 30,
    (view) => Math.max(view.streak.current, view.streak.longest)),
  milestone("streak-100", "💎", "Trăm ngày", "Giữ chuỗi 100 ngày liên tiếp", 100,
    (view) => Math.max(view.streak.current, view.streak.longest)),

  milestone("reviews-100", "📗", "100 lượt ôn", "Ôn 100 lượt trong app", 100,
    (_view, data) => totalReviews(data)),
  milestone("reviews-500", "📘", "500 lượt ôn", "Ôn 500 lượt trong app", 500,
    (_view, data) => totalReviews(data)),
  milestone("reviews-2000", "📚", "2000 lượt ôn", "Ôn 2000 lượt trong app", 2000,
    (_view, data) => totalReviews(data)),

  milestone("done-all", "🗺️", "Phủ kín giáo trình", "Đụng tới cả 1608 bài", 1608,
    (view) => view.attempted),
  milestone("mastered-200", "🧠", "Nhớ lâu", "200 bài đạt chu kỳ ôn từ 14 ngày", 200,
    (view) => view.mastered),
  milestone("mastered-800", "🦉", "Vững kiến thức", "800 bài đạt chu kỳ ôn từ 14 ngày", 800,
    (view) => view.mastered),

  milestone("comeback-100", "💪", "Sửa sai", "100 bài từ Sai chuyển thành Đúng", 100,
    (_view, data) => comebacks(data)),
  {
    id: "clear-due",
    icon: "🌤️",
    name: "Bàn học sạch",
    description: "Ôn hết bài đến hạn, không còn bài nào quá hạn",
    // "Hết bài đến hạn" chỉ là thành tích khi bạn thực sự đang chạy một lịch ôn
    // có quy mô. Người mới cài, hoặc người vừa chấm đúng một bài, cũng thoả điều
    // kiện đó về mặt chữ nghĩa — nên phải có ít nhất SCHEDULED_FLOOR bài nằm
    // trong chu kỳ thì mới tính.
    earned: (view, data) =>
      view.dueToday === 0 && scheduledCount(data) >= SCHEDULED_FLOOR,
    progress: (view, data) =>
      view.dueToday === 0 ? ratio(scheduledCount(data), SCHEDULED_FLOOR) : 0,
  },

  {
    id: "all-subjects",
    icon: "👑",
    name: "Bốn môn trọn vẹn",
    description: "Không còn bài chưa làm ở cả bốn môn",
    earned: (view) => view.bySubject.every((subject) => subject.counts.todo === 0),
    progress: (view) =>
      ratio(
        view.bySubject.filter((subject) => subject.counts.todo === 0).length,
        view.bySubject.length,
      ),
  },
];

/**
 * Trả về map huy hiệu mới đạt được (id -> ngày), để store ghi vào data.badges.
 * Chỉ thêm huy hiệu chưa có, không bao giờ gỡ huy hiệu cũ.
 */
export function newlyEarned(
  view: Overview,
  data: AppData,
  today: string,
): Record<string, string> {
  const fresh: Record<string, string> = {};
  for (const badge of BADGES) {
    if (data.badges[badge.id]) continue;
    if (badge.earned(view, data)) fresh[badge.id] = today;
  }
  return fresh;
}
