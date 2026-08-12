/**
 * Lịch sử những bài vừa chấm, gom theo ngày.
 *
 * Không cần thêm kho dữ liệu nào: mỗi lần chấm đúng/sai đã được ghi vào
 * `progress[id].history` từ trước. Ở đây chỉ quét ngược lại và gom theo ngày.
 *
 * Vì sao chỉ giữ 3 ngày: `applyReview` cắt history còn 50 lần gần nhất mỗi bài,
 * nên lịch sử xa hơn không bảo đảm còn đủ. Hứa 3 ngày và giữ đúng 3 ngày thì
 * tốt hơn là hứa "toàn bộ" rồi thỉnh thoảng thiếu mà không rõ vì sao.
 */

import { itemById } from "./catalog";
import { addDays, todayISO } from "./srs";
import type { AppData, CatalogItem } from "./types";

export interface ActivityEntry {
  item: CatalogItem;
  result: "correct" | "wrong";
  /** Cấp độ ôn sau lần chấm đó. */
  level: number;
  /**
   * Lần chấm thứ mấy của bài đó trong ngày. Cùng một bài chấm lại nhiều lần
   * trong ngày (bấm nhầm rồi sửa) thì chỉ giữ lần cuối, xem `dayLog`.
   */
  times: number;
}

export interface ActivityDay {
  date: string;
  /** "Hôm nay" / "Hôm qua" / "Hôm kia". */
  label: string;
  entries: ActivityEntry[];
  correct: number;
  wrong: number;
}

const DAY_LABELS = ["Hôm nay", "Hôm qua", "Hôm kia"];

/**
 * Ba ngày gần nhất, ngày mới nhất trước.
 *
 * Một bài chấm nhiều lần trong cùng ngày chỉ hiện **một dòng**, lấy kết quả của
 * lần cuối — đó mới là trạng thái thật của bài lúc cuối ngày. Số lần chấm vẫn
 * được giữ ở `times` để không giấu mất việc đã sửa lại.
 */
export function recentActivity(
  data: AppData,
  days = 3,
  today = todayISO(),
): ActivityDay[] {
  const wanted = new Map<string, number>();
  for (let offset = 0; offset < days; offset += 1) {
    wanted.set(addDays(today, -offset), offset);
  }

  // ngày -> id bài -> lần chấm cuối cùng trong ngày
  const byDay = new Map<string, Map<string, ActivityEntry>>();

  for (const [id, progress] of Object.entries(data.progress)) {
    const item = itemById.get(id);
    if (!item) continue;

    for (const event of progress.history) {
      if (!wanted.has(event.date)) continue;

      const bucket = byDay.get(event.date) ?? new Map<string, ActivityEntry>();
      const seen = bucket.get(id);
      bucket.set(id, {
        item,
        result: event.result,
        level: event.level,
        times: (seen?.times ?? 0) + 1,
      });
      byDay.set(event.date, bucket);
    }
  }

  const out: ActivityDay[] = [];
  for (const [date, offset] of wanted) {
    const entries = [...(byDay.get(date)?.values() ?? [])];
    if (entries.length === 0) continue;

    // Bài làm sai lên trước — đó là thứ cần nhìn lại.
    entries.sort((a, b) => {
      if (a.result !== b.result) return a.result === "wrong" ? -1 : 1;
      return a.item.no - b.item.no;
    });

    out.push({
      date,
      label: DAY_LABELS[offset] ?? date,
      entries,
      correct: entries.filter((entry) => entry.result === "correct").length,
      wrong: entries.filter((entry) => entry.result === "wrong").length,
    });
  }
  return out;
}
