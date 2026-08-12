/**
 * "Đang yếu ở đâu" — xếp hạng chủ đề theo tỉ lệ sai.
 *
 * Gộp hai nguồn, vì mỗi nguồn chỉ nói một nửa sự thật:
 *
 *   Ôn tập   mỗi lần chấm đúng/sai trong `progress[id].history` là một lượt.
 *            Đây là nguồn dày nhất, phản ánh việc học hằng ngày.
 *   Thi thử  từng ý trong `examResults[].scores[].answers`. Đây là lúc làm
 *            trong sức ép thời gian, sai ở đây mới là sai thật.
 *
 * Chỉ đếm chủ đề đã làm đủ nhiều (`MIN_ATTEMPTS`): một chủ đề mới làm hai bài,
 * sai một bài, sẽ ra 50% và nhảy lên đầu bảng, che mất chỗ yếu thật sự.
 */

import { itemById, items, subjects } from "./catalog";
import type { AppData, SubjectKey } from "./types";

/** Dưới mức này thì mẫu quá nhỏ, tỉ lệ không nói lên điều gì. */
export const MIN_ATTEMPTS = 4;

export interface TopicWeakness {
  subject: SubjectKey;
  topic: string;
  /** Tổng số lượt tính được (ôn tập + ý trong đề thi). */
  attempts: number;
  wrong: number;
  /** Tỉ lệ sai, 0..1. */
  ratio: number;
  /** Bao nhiêu lượt đến từ ôn tập. */
  fromReview: number;
  /** Bao nhiêu ý đến từ thi thử. */
  fromExam: number;
  /** Tổng số bài của chủ đề trong danh mục, để biết bấm vào sẽ ôn bao nhiêu bài. */
  totalItems: number;
}

/**
 * Khoá gộp môn + chủ đề.
 *
 * Ngăn cách bằng ký tự xuống dòng vì tên chủ đề tiếng Nhật có cả dấu cách lẫn
 * dấu ngoặc — tách bằng dấu cách sẽ cắt nhầm giữa tên chủ đề.
 */
const SEP = "\n";

function topicKey(subject: SubjectKey, topic: string): string {
  return subject + SEP + topic;
}

interface Tally {
  attempts: number;
  wrong: number;
  fromReview: number;
  fromExam: number;
}

function emptyTally(): Tally {
  return { attempts: 0, wrong: 0, fromReview: 0, fromExam: 0 };
}

/** Số bài mỗi chủ đề có trong danh mục. */
const topicSize = (() => {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = topicKey(item.subject, item.topic);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
})();

/**
 * Xếp hạng chủ đề yếu của từng môn.
 *
 * @param perSubject số chủ đề lấy ra mỗi môn.
 */
export function weakTopics(
  data: AppData,
  perSubject = 5,
): Record<SubjectKey, TopicWeakness[]> {
  const tally = new Map<string, Tally>();
  const bump = (
    subject: SubjectKey,
    topic: string,
    wrong: boolean,
    source: "review" | "exam",
  ) => {
    const key = topicKey(subject, topic);
    const row = tally.get(key) ?? emptyTally();
    row.attempts += 1;
    if (wrong) row.wrong += 1;
    if (source === "review") row.fromReview += 1;
    else row.fromExam += 1;
    tally.set(key, row);
  };

  // Nguồn 1: từng lần chấm đúng/sai khi ôn tập.
  for (const [id, progress] of Object.entries(data.progress)) {
    const item = itemById.get(id);
    if (!item) continue;
    for (const event of progress.history) {
      bump(item.subject, item.topic, event.result === "wrong", "review");
    }
  }

  // Nguồn 2: từng ý trong các lượt thi thử đã lưu.
  for (const result of data.examResults) {
    for (const score of result.scores) {
      for (const record of score.answers ?? []) {
        const item = itemById.get(record.id);
        if (!item) continue;
        record.truth.forEach((truth, index) => {
          if (truth === null || truth === undefined) return; // chưa có đáp án
          // Bỏ trống trong phòng thi cũng là mất điểm, tính như sai.
          bump(item.subject, item.topic, record.picked[index] !== truth, "exam");
        });
      }
    }
  }

  const out = {} as Record<SubjectKey, TopicWeakness[]>;
  for (const subject of subjects) out[subject.key] = [];

  for (const [key, row] of tally) {
    const cut = key.indexOf(SEP);
    const subject = key.slice(0, cut) as SubjectKey;
    const topic = key.slice(cut + 1);
    if (row.attempts < MIN_ATTEMPTS || row.wrong === 0) continue;
    out[subject]?.push({
      subject,
      topic,
      attempts: row.attempts,
      wrong: row.wrong,
      ratio: row.wrong / row.attempts,
      fromReview: row.fromReview,
      fromExam: row.fromExam,
      totalItems: topicSize.get(key) ?? 0,
    });
  }

  for (const subject of subjects) {
    out[subject.key] = out[subject.key]
      .sort((a, b) => {
        if (b.ratio !== a.ratio) return b.ratio - a.ratio;
        // Cùng tỉ lệ thì chủ đề sai nhiều lượt hơn đáng lo hơn.
        return b.wrong - a.wrong;
      })
      .slice(0, perSubject);
  }
  return out;
}
