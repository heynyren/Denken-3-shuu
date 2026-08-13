/**
 * Bảng phân tích một lượt thi.
 *
 * Dùng chung cho hai chỗ: màn kết quả ngay sau khi nộp, và khi mở lại một lượt
 * thi trong lịch sử. Cả hai đều chỉ cần `ExamAnswerRecord[]` — chọn gì, đúng là
 * gì — nên không có đường nào để hai chỗ hiện ra hai kết quả khác nhau.
 */

import { Check, CircleDashed, Minus, X } from "lucide-react";
import { Ic } from "./ui/icon";
import { itemById, subjectName, subjectViName } from "../lib/catalog";
import { SUB_LABELS, subState, topicBreakdown } from "../lib/exam";
import type { ExamAnswerRecord, ExamResult, SubjectKey } from "../lib/types";
import { Bar, openLink } from "./ui";

const STATE_MARK = {
  right: Check,
  wrong: X,
  blank: CircleDashed,
  unknown: Minus,
} as const;

/** Màu theo tỉ lệ đúng: đỏ là chỗ phải ôn lại ngay. */
function ratioColor(ratio: number): string {
  if (ratio >= 0.8) return "var(--green)";
  if (ratio >= 0.6) return "var(--blue)";
  if (ratio >= 0.4) return "var(--amber)";
  return "var(--red)";
}

/* ------------------------------------------------------------------ */
/* Đúng bao nhiêu % ở từng chủ đề                                      */
/* ------------------------------------------------------------------ */

export function TopicTable({
  records,
  onOpenTopic,
}: {
  records: ExamAnswerRecord[];
  onOpenTopic?(subject: SubjectKey, topic: string): void;
}) {
  const rows = topicBreakdown(records);
  if (rows.length === 0) return null;

  return (
    <div className="topic-table">
      {rows.map((row) => (
        <div className="topic-row" key={`${row.subject} ${row.topic}`}>
          <span className="topic-name ja" title={row.topic}>
            {row.topic}
          </span>
          <span className="small dim nowrap">{row.questions} câu</span>
          {row.graded === 0 ? (
            <>
              <span className="topic-bar-cell">
                <Bar ratio={0} color="var(--muted)" />
              </span>
              <span className="small dim nowrap">chưa có đáp án</span>
            </>
          ) : (
            <>
              <span className="topic-bar-cell">
                <Bar ratio={row.ratio} color={ratioColor(row.ratio)} />
              </span>
              <span
                className="topic-pct nowrap"
                style={{ color: ratioColor(row.ratio) }}
              >
                {Math.round(row.ratio * 100)}%
              </span>
              <span className="small muted nowrap">
                {row.correct}/{row.graded} ý
              </span>
            </>
          )}
          {onOpenTopic && (
            <button
              className="btn ghost xs"
              onClick={() => onOpenTopic(row.subject, row.topic)}
              title="Ôn lại toàn bộ chủ đề này"
            >
              Ôn lại →
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Từng câu: chọn gì, đúng là gì                                       */
/* ------------------------------------------------------------------ */

export function QuestionTable({ records }: { records: ExamAnswerRecord[] }) {
  return (
    <div className="exam-review">
      {records.flatMap((record) => {
        const item = itemById.get(record.id);
        const subs = Math.max(record.truth.length, record.picked.length, 1);

        return Array.from({ length: subs }, (_, index) => {
          const truth = record.truth[index] ?? null;
          const picked = record.picked[index] ?? null;
          const state = subState(picked, truth);

          return (
            <div className={`exam-review-q ${state}`} key={`${record.id}-${index}`}>
              <span className="mono">
                {item?.question ?? "?"}
                {subs > 1 && ` ${SUB_LABELS[index]}`}
              </span>
              <span className="exam-review-mark">
                <Ic i={STATE_MARK[state]} className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <span className="small dim">
                {state === "unknown"
                  ? "chưa có đáp án"
                  : `bạn chọn ${picked ?? "—"} · đúng là ${truth}`}
              </span>
              {item && (
                <span className="exam-review-topic ja" title={item.name}>
                  {item.topic}
                </span>
              )}
              <span className="spacer" />
              {item && (
                <button
                  className="icon-btn"
                  title="Mở lời giải trên denken-ou.com"
                  onClick={() => openLink(item.url)}
                >
                  ↗
                </button>
              )}
            </div>
          );
        });
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cả một lượt thi đã lưu                                              */
/* ------------------------------------------------------------------ */

/**
 * Mở lại một lượt thi trong lịch sử: điểm từng môn, chủ đề nào yếu, rồi tới
 * từng câu. Lượt thi lưu từ bản cũ không có bài làm chi tiết nên chỉ hiện điểm.
 */
export function AttemptAnalysis({
  result,
  onOpenTopic,
}: {
  result: ExamResult;
  onOpenTopic?(subject: SubjectKey, topic: string): void;
}) {
  const detailed = result.scores.filter((score) => (score.answers?.length ?? 0) > 0);

  if (detailed.length === 0) {
    return (
      <div className="callout" style={{ marginTop: 10 }}>
        Lượt thi này được lưu bằng bản app cũ nên chỉ có điểm, không có bài làm
        từng câu. Những lượt thi từ giờ trở đi đều có bảng phân tích đầy đủ.
      </div>
    );
  }

  return (
    <div className="attempt-analysis">
      {detailed.map((score) => (
        <div className="attempt-subject" key={score.subject}>
          <div className="row between wrap" style={{ gap: 10, marginBottom: 10 }}>
            <div className="row" style={{ gap: 8 }}>
              <span className="ja" style={{ fontWeight: 700 }}>
                {subjectName(score.subject)}
              </span>
              <span className="small dim">{subjectViName(score.subject)}</span>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <span className={`pill ${score.passed ? "correct" : "wrong"}`}>
                {score.score}/100 · {score.passed ? "Đạt" : "Chưa đạt"}
              </span>
              <span className="small muted nowrap">
                đúng {score.correct}/{score.total} ý
              </span>
            </div>
          </div>

          <div className="small dim" style={{ marginBottom: 6 }}>
            Đúng bao nhiêu phần trăm ở từng chủ đề ra trong đề này
          </div>
          <TopicTable records={score.answers ?? []} onOpenTopic={onOpenTopic} />

          <div className="small dim" style={{ margin: "14px 0 6px" }}>
            Từng câu
          </div>
          <QuestionTable records={score.answers ?? []} />
        </div>
      ))}
    </div>
  );
}
