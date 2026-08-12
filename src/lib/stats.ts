/**
 * Mọi con số hiển thị trên màn hình đều tính ở đây, từ AppData thô.
 * Giữ tách khỏi React để dễ đọc và dễ kiểm chứng.
 */

import { items, subjects } from "./catalog";
import { addDays, daysBetween, isDue, overdueDays, todayISO } from "./srs";
import type {
  AppData,
  CatalogItem,
  ItemProgress,
  ItemStatus,
  SubjectKey,
} from "./types";

export type StatusCount = Record<ItemStatus, number>;

function emptyCount(): StatusCount {
  return { todo: 0, correct: 0, relearned: 0, wrong: 0 };
}

export interface SubjectStats {
  key: SubjectKey;
  name: string;
  viName: string;
  total: number;
  counts: StatusCount;
  attempted: number;
  /** Tỉ lệ đã đụng tới, 0..1 */
  progress: number;
  due: number;
}

export interface TodayStats {
  date: string;
  reviewed: number;
  correct: number;
  wrong: number;
  goal: number;
  /** 0..1, đã chặn trần ở 1 để vẽ vòng tròn. */
  ratio: number;
  remaining: number;
  metGoal: boolean;
}

export interface StreakStats {
  current: number;
  longest: number;
  /** Hôm nay chưa đạt KPI nhưng hôm qua có → chuỗi đang treo, nhắc người dùng. */
  atRisk: boolean;
}

export interface Overview {
  today: TodayStats;
  streak: StreakStats;
  total: number;
  counts: StatusCount;
  attempted: number;
  progress: number;
  dueToday: number;
  overdue: number;
  mastered: number;
  bySubject: SubjectStats[];
  examDate: string;
  daysToExam: number;
  /**
   * Số bài cần làm mỗi ngày để xử lý hết phần còn nợ trước ngày thi.
   * Nợ = chưa làm + đang sai — bài đang sai cũng phải quay lại làm cho đúng,
   * bỏ nó ra ngoài thì con số này lạc quan quá mức.
   */
  paceNeeded: number;
  /** Chưa làm + đang sai. */
  remaining: number;
}

export function statusOf(data: AppData, id: string): ItemStatus {
  return data.progress[id]?.status ?? "todo";
}

export function progressOf(data: AppData, id: string): ItemProgress | undefined {
  return data.progress[id];
}

/* ------------------------------------------------------------------ */
/* Chuỗi ngày liên tiếp                                                */
/* ------------------------------------------------------------------ */

/**
 * Một ngày được tính vào chuỗi khi số bài ôn đạt mục tiêu ngày.
 * Chuỗi hiện tại được đếm lùi từ hôm nay; nếu hôm nay chưa đạt thì đếm lùi từ
 * hôm qua, để chuỗi không bị coi là đứt ngay lúc bạn còn đang học dở.
 */
export function computeStreak(data: AppData, today: string): StreakStats {
  const goal = Math.max(1, data.settings.dailyGoal);
  const met = (day: string) => (data.dailyLog[day]?.reviewed ?? 0) >= goal;

  const countingFromYesterday = !met(today);
  let current = 0;
  let cursor = countingFromYesterday ? addDays(today, -1) : today;
  while (met(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  // Chuỗi dài nhất từ trước tới nay: duyệt các ngày đạt mục tiêu theo thứ tự,
  // ngày nào có ngày liền trước cũng đạt thì nối dài chuỗi, không thì bắt đầu lại.
  let longest = 0;
  let run = 0;
  for (const day of Object.keys(data.dailyLog).sort()) {
    if (!met(day)) continue;
    run = met(addDays(day, -1)) ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  return {
    current,
    longest: Math.max(longest, current),
    atRisk: countingFromYesterday && current > 0,
  };
}

/* ------------------------------------------------------------------ */
/* Tổng quan                                                           */
/* ------------------------------------------------------------------ */

export function computeOverview(data: AppData, today = todayISO()): Overview {
  const counts = emptyCount();
  const perSubject = new Map<SubjectKey, StatusCount>();
  const dueCount = new Map<SubjectKey, number>();

  let dueToday = 0;
  let overdue = 0;
  let mastered = 0;

  for (const subject of subjects) {
    perSubject.set(subject.key, emptyCount());
    dueCount.set(subject.key, 0);
  }

  for (const item of items) {
    const progress = data.progress[item.id];
    const status = progress?.status ?? "todo";
    counts[status] += 1;
    const bucket = perSubject.get(item.subject);
    if (bucket) bucket[status] += 1;

    if (isDue(progress, today)) {
      dueToday += 1;
      dueCount.set(item.subject, (dueCount.get(item.subject) ?? 0) + 1);
      if (overdueDays(progress, today) > 0) overdue += 1;
    }
    // Cấp 4 trở lên (14 ngày) coi như đã vào trí nhớ dài hạn.
    if ((progress?.srsLevel ?? 0) >= 4) mastered += 1;
  }

  const log = data.dailyLog[today];
  const reviewed = log?.reviewed ?? 0;
  const goal = Math.max(1, data.settings.dailyGoal);

  const attempted = items.length - counts.todo;
  const daysToExam = daysBetween(today, data.settings.examDate);

  return {
    today: {
      date: today,
      reviewed,
      correct: log?.correct ?? 0,
      wrong: log?.wrong ?? 0,
      goal,
      ratio: Math.min(1, reviewed / goal),
      remaining: Math.max(0, goal - reviewed),
      metGoal: reviewed >= goal,
    },
    streak: computeStreak(data, today),
    total: items.length,
    counts,
    attempted,
    progress: attempted / items.length,
    dueToday,
    overdue,
    mastered,
    bySubject: subjects.map((subject) => {
      const bucket = perSubject.get(subject.key) ?? emptyCount();
      const total = bucket.todo + bucket.correct + bucket.relearned + bucket.wrong;
      return {
        key: subject.key,
        name: subject.name,
        viName: subject.viName,
        total,
        counts: bucket,
        attempted: total - bucket.todo,
        progress: total === 0 ? 0 : (total - bucket.todo) / total,
        due: dueCount.get(subject.key) ?? 0,
      };
    }),
    examDate: data.settings.examDate,
    daysToExam,
    remaining: counts.todo + counts.wrong,
    paceNeeded:
      daysToExam > 0
        ? Math.ceil((counts.todo + counts.wrong) / daysToExam)
        : counts.todo + counts.wrong,
  };
}

/* ------------------------------------------------------------------ */
/* Hàng đợi ôn tập hôm nay                                             */
/* ------------------------------------------------------------------ */

/**
 * Thứ tự ưu tiên: quá hạn lâu nhất lên trước, rồi tới bài khó hơn.
 * Bài quá hạn là bài trí nhớ đang trôi nhanh nhất nên phải cứu trước.
 */
export function dueQueue(data: AppData, today = todayISO()): CatalogItem[] {
  return items
    .filter((item) => isDue(data.progress[item.id], today))
    .sort((a, b) => {
      const lateDiff =
        overdueDays(data.progress[b.id], today) -
        overdueDays(data.progress[a.id], today);
      if (lateDiff !== 0) return lateDiff;
      return b.stars - a.stars;
    });
}

/**
 * Bài chưa từng làm.
 *
 * Xét theo TRẠNG THÁI chứ không theo "có ngày làm bài hay chưa": trong file
 * Excel chỉ những bài mới ôn gần đây mới được điền ngày, nên lấy theo ngày sẽ
 * kéo cả nghìn bài đã làm đúng từ lâu vào đây.
 */
export function freshQueue(data: AppData): CatalogItem[] {
  return items.filter((item) => (data.progress[item.id]?.status ?? "todo") === "todo");
}

/**
 * Bài đang sai — nhóm đáng quay lại nhất.
 * Bài khó xếp lên trước vì đó thường là chỗ hổng kiến thức thật sự.
 */
export function wrongQueue(data: AppData): CatalogItem[] {
  return items
    .filter((item) => data.progress[item.id]?.status === "wrong")
    .sort((a, b) => b.stars - a.stars);
}

/**
 * Toàn bộ bài của một chủ đề — dùng khi bấm vào một chủ đề yếu ở trang Hôm nay.
 *
 * Lấy hết, kể cả bài đã làm đúng: mục đích là ôn lại cả mảng kiến thức đang
 * hổng chứ không chỉ vá vài bài lẻ. Xếp theo mức cần xử lý: đang sai → chưa làm
 * → đến hạn → còn lại; trong mỗi nhóm thì bài khó lên trước.
 */
export function topicQueue(
  data: AppData,
  subject: SubjectKey,
  topic: string,
  today = todayISO(),
): CatalogItem[] {
  const rank = (item: CatalogItem) => {
    const progress = data.progress[item.id];
    if (progress?.status === "wrong") return 0;
    if ((progress?.status ?? "todo") === "todo") return 1;
    if (isDue(progress, today)) return 2;
    return 3;
  };
  return items
    .filter((item) => item.subject === subject && item.topic === topic)
    .sort((a, b) => {
      const diff = rank(a) - rank(b);
      if (diff !== 0) return diff;
      if (b.stars !== a.stars) return b.stars - a.stars;
      return a.no - b.no;
    });
}

/* ------------------------------------------------------------------ */
/* Dữ liệu biểu đồ                                                     */
/* ------------------------------------------------------------------ */

export interface DayPoint {
  date: string;
  reviewed: number;
  correct: number;
  wrong: number;
}

/** Chuỗi ngày liên tục (kể cả ngày trống) để vẽ lịch nhiệt và cột. */
export function dailySeries(data: AppData, days: number, today = todayISO()): DayPoint[] {
  const series: DayPoint[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = addDays(today, -offset);
    const log = data.dailyLog[date];
    series.push({
      date,
      reviewed: log?.reviewed ?? 0,
      correct: log?.correct ?? 0,
      wrong: log?.wrong ?? 0,
    });
  }
  return series;
}

/** Gộp theo tuần để nhìn xu hướng dài hạn thay vì nhiễu từng ngày. */
export function weeklySeries(data: AppData, weeks: number, today = todayISO()) {
  const daily = dailySeries(data, weeks * 7, today);
  const buckets: Array<{ label: string; reviewed: number; correct: number; wrong: number }> = [];

  for (let index = 0; index < daily.length; index += 7) {
    const chunk = daily.slice(index, index + 7);
    const first = chunk[0];
    if (!first) continue;
    buckets.push({
      label: first.date.slice(5).replace("-", "/"),
      reviewed: chunk.reduce((sum, day) => sum + day.reviewed, 0),
      correct: chunk.reduce((sum, day) => sum + day.correct, 0),
      wrong: chunk.reduce((sum, day) => sum + day.wrong, 0),
    });
  }
  return buckets;
}

/** Lịch ôn sắp tới: mỗi ngày có bao nhiêu bài đến hạn. */
export function upcomingLoad(data: AppData, days: number, today = todayISO()) {
  const counts = new Map<string, number>();
  for (let offset = 0; offset < days; offset += 1) {
    counts.set(addDays(today, offset), 0);
  }
  for (const item of items) {
    const next = data.progress[item.id]?.nextReview;
    if (!next) continue;
    // Bài quá hạn dồn hết vào cột hôm nay.
    const key = daysBetween(today, next) < 0 ? today : next;
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([date, count]) => ({ date, count }));
}
