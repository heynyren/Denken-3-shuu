/**
 * Thi thử theo từng kỳ thi.
 *
 * Ba bước: chọn đề → làm bài (có bấm giờ) → xem kết quả.
 * Luật thi mô phỏng đề thật, xem src/lib/exam.ts.
 */

import { useEffect, useMemo, useRef, useState } from "react";

import { Ring, Stars, openLink } from "../components/ui";
import { subjectName, subjectViName, subjects } from "../lib/catalog";
import { createAlarm } from "../lib/alarm";
import answersFile from "../data/answers.json";
import {
  CHOICE_PAIR,
  EXAM_MINUTES,
  PASS_MARK,
  examSets,
  formatExamClock,
  gradePaper,
  questionsToAnswer,
} from "../lib/exam";
import type { ExamPaper, SubjectScore } from "../lib/exam";
import { isPartB } from "../lib/timing";
import type { SubjectKey } from "../lib/types";
import type { Store } from "../state/useStore";

const ANSWERS = (answersFile as { answers: Record<string, number> }).answers;

type Stage = "setup" | "running" | "result";

/** Tổng thời gian cho các môn đã chọn, tính bằng giây. */
function totalSeconds(list: SubjectKey[]): number {
  return list.reduce((sum, key) => sum + EXAM_MINUTES[key] * 60, 0);
}

export default function Exam({ store }: { store: Store }) {
  const [stage, setStage] = useState<Stage>("setup");
  const [exam, setExam] = useState(examSets[0]?.exam ?? "");
  const [chosen, setChosen] = useState<SubjectKey[]>(["riron"]);

  // Bài làm: id bài -> lựa chọn 1..5
  const [picks, setPicks] = useState<Record<string, number>>({});
  // 理論/機械 chỉ được làm một trong 問17 hoặc 問18
  const [choice, setChoice] = useState<Partial<Record<SubjectKey, number>>>({});
  const [scores, setScores] = useState<SubjectScore[]>([]);

  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [left, setLeft] = useState(0);
  const alarm = useRef(createAlarm());

  const set = useMemo(() => examSets.find((s) => s.exam === exam), [exam]);
  const papers = useMemo(
    () =>
      chosen
        .map((key) => set?.papers[key])
        .filter((paper): paper is ExamPaper => Boolean(paper)),
    [set, chosen],
  );

  /** Bao nhiêu câu của đề đang chọn đã có đáp án để chấm. */
  const coverage = useMemo(() => {
    const all = papers.flatMap((paper) => paper.questions);
    const graded = all.filter((item) => ANSWERS[item.id] !== undefined);
    return { total: all.length, graded: graded.length };
  }, [papers]);

  /* ---------------- đồng hồ ---------------- */

  useEffect(() => {
    if (endsAt === null) return;
    const tick = () => {
      const remain = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setLeft(remain);
      if (remain === 0) {
        setEndsAt(null);
        alarm.current.start();
        finish();
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt]);

  const alarmRef = alarm.current;
  useEffect(() => () => alarmRef.stop(), [alarmRef]);

  /* ---------------- các bước ---------------- */

  const begin = () => {
    if (papers.length === 0) return;
    setPicks({});
    setScores([]);
    setChoice(
      Object.fromEntries(
        papers.filter((p) => p.hasChoice).map((p) => [p.subject, CHOICE_PAIR[0]]),
      ),
    );
    setEndsAt(Date.now() + totalSeconds(chosen) * 1000);
    setStage("running");
  };

  const finish = () => {
    setScores(
      papers.map((paper) =>
        gradePaper({
          paper,
          choice: choice[paper.subject] ?? null,
          picks,
          answers: ANSWERS,
        }),
      ),
    );
    setEndsAt(null);
    setStage("result");
  };

  const quit = () => {
    alarm.current.stop();
    setEndsAt(null);
    setStage("setup");
  };

  /* ================= chọn đề ================= */

  if (stage === "setup") {
    const gradedRatio = coverage.total > 0 ? coverage.graded / coverage.total : 0;

    return (
      <div className="container">
        <div className="card">
          <div className="card-head">
            <div className="card-title">
              📝 Thi thử
              <div className="card-sub">
                Làm nguyên một kỳ thi thật, có bấm giờ và chấm điểm
              </div>
            </div>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <span className="field-label">Chọn kỳ thi</span>
            <select
              className="select"
              value={exam}
              onChange={(event) => setExam(event.target.value)}
            >
              {examSets.map((entry) => {
                const count = Object.values(entry.papers).reduce(
                  (sum, paper) => sum + paper.questions.length,
                  0,
                );
                return (
                  <option key={entry.exam} value={entry.exam}>
                    {entry.exam} — {count} câu, {Object.keys(entry.papers).length} môn
                  </option>
                );
              })}
            </select>
          </div>

          <div className="field-label" style={{ marginBottom: 8 }}>
            Chọn môn thi
          </div>
          <div className="exam-subjects">
            {subjects.map((subject) => {
              const paper = set?.papers[subject.key];
              const on = chosen.includes(subject.key);
              return (
                <button
                  key={subject.key}
                  className={`exam-subject${on ? " on" : ""}`}
                  disabled={!paper}
                  onClick={() =>
                    setChosen((current) =>
                      current.includes(subject.key)
                        ? current.filter((k) => k !== subject.key)
                        : [...current, subject.key],
                    )
                  }
                >
                  <div className="ja exam-subject-name">{subject.name}</div>
                  <div className="small dim">{subject.viName}</div>
                  <div className="small muted" style={{ marginTop: 6 }}>
                    {paper ? `${paper.questions.length} câu` : "không có đề"}
                  </div>
                  <div className="small dim">{EXAM_MINUTES[subject.key]} phút</div>
                </button>
              );
            })}
          </div>

          <div className="btn-row" style={{ marginTop: 12 }}>
            <button
              className="btn sm"
              onClick={() => setChosen(subjects.map((s) => s.key))}
            >
              Chọn cả 4 môn
            </button>
            <button className="btn sm ghost" onClick={() => setChosen([])}>
              Bỏ chọn hết
            </button>
          </div>

          {chosen.length > 0 && (
            <div className="callout" style={{ marginTop: 16 }}>
              Sẽ thi <strong>{chosen.length} môn</strong>, tổng thời gian{" "}
              <strong>{Math.round(totalSeconds(chosen) / 60)} phút</strong>. Điểm đạt
              là <strong>{PASS_MARK}/100</strong> mỗi môn.
            </div>
          )}

          {/* Chưa có bảng đáp án thì nói thẳng, đừng để người dùng thi xong mới biết */}
          {coverage.total > 0 && gradedRatio < 1 && (
            <div
              className={`callout ${gradedRatio === 0 ? "danger" : "warn"}`}
              style={{ marginTop: 12 }}
            >
              {gradedRatio === 0 ? (
                <>
                  <strong>Đề này chưa có đáp án nên chưa chấm được.</strong> Bạn vẫn thi
                  và bấm giờ bình thường, nhưng phần chấm điểm sẽ để trống. Nạp đáp án
                  bằng <span className="mono">scripts/build-answers.py</span>.
                </>
              ) : (
                <>
                  Mới có đáp án cho <strong>{coverage.graded}/{coverage.total}</strong>{" "}
                  câu. Điểm sẽ được quy về thang 100 trên phần chấm được, số câu còn
                  lại không tính là sai.
                </>
              )}
            </div>
          )}

          <button
            className="btn primary lg"
            style={{ marginTop: 18 }}
            disabled={papers.length === 0}
            onClick={begin}
          >
            Bắt đầu thi →
          </button>
        </div>

        <ExamHistory store={store} />
      </div>
    );
  }

  /* ================= đang làm bài ================= */

  if (stage === "running") {
    const answered = Object.keys(picks).length;
    const need = papers.reduce(
      (sum, paper) =>
        sum + questionsToAnswer(paper, choice[paper.subject] ?? null).length,
      0,
    );

    return (
      <div className="container">
        <div className="exam-bar">
          <Ring
            ratio={left / Math.max(1, totalSeconds(chosen))}
            size={64}
            width={7}
            color={left <= 300 ? "var(--red)" : "var(--blue)"}
          >
            <div className="exam-clock">{formatExamClock(left)}</div>
          </Ring>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700 }}>
              {exam} — {papers.map((p) => subjectName(p.subject)).join(" · ")}
            </div>
            <div className="small muted">
              Đã trả lời {answered}/{need} câu
              {left <= 300 && " · sắp hết giờ!"}
            </div>
          </div>
          <button className="btn success" onClick={finish}>
            Nộp bài
          </button>
          <button className="btn ghost sm" onClick={quit}>
            Thoát
          </button>
        </div>

        {papers.map((paper) => (
          <PaperSheet
            key={paper.subject}
            paper={paper}
            picks={picks}
            onPick={(id, value) => setPicks((c) => ({ ...c, [id]: value }))}
            choice={choice[paper.subject] ?? null}
            onChoice={(value) =>
              setChoice((c) => ({ ...c, [paper.subject]: value }))
            }
          />
        ))}

        <div className="card center">
          <button className="btn success lg" onClick={finish}>
            Nộp bài và xem điểm
          </button>
        </div>
      </div>
    );
  }

  /* ================= kết quả ================= */

  return (
    <ExamResult
      exam={exam}
      scores={scores}
      papers={papers}
      picks={picks}
      choice={choice}
      onAgain={() => setStage("setup")}
      onSave={() => {
        store.saveExamResult({
          id: `exam-${Date.now()}`,
          exam,
          takenAt: new Date().toISOString(),
          scores: scores.map((s) => ({
            subject: s.subject,
            score: s.score,
            correct: s.correct,
            total: s.total,
            passed: s.passed,
          })),
        });
        setStage("setup");
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Một môn trong bài thi                                               */
/* ------------------------------------------------------------------ */

function PaperSheet({
  paper,
  picks,
  onPick,
  choice,
  onChoice,
}: {
  paper: ExamPaper;
  picks: Record<string, number>;
  onPick(id: string, value: number): void;
  choice: number | null;
  onChoice(value: number): void;
}) {
  const active = questionsToAnswer(paper, choice);
  const activeIds = new Set(active.map((item) => item.id));

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          <span className="ja">{subjectName(paper.subject)}</span>{" "}
          <span className="card-sub">{subjectViName(paper.subject)}</span>
        </div>
        <span className="small muted">{EXAM_MINUTES[paper.subject]} phút</span>
      </div>

      {paper.hasChoice && (
        <div className="callout warn" style={{ marginBottom: 14 }}>
          <strong>Chọn một trong hai câu cuối.</strong> Môn này chỉ được làm{" "}
          <span className="mono">問{CHOICE_PAIR[0]}</span> <em>hoặc</em>{" "}
          <span className="mono">問{CHOICE_PAIR[1]}</span>, không làm cả hai.
          <div className="chip-row" style={{ marginTop: 10 }}>
            {CHOICE_PAIR.map((number) => (
              <button
                key={number}
                className={`chip${choice === number ? " on" : ""}`}
                onClick={() => onChoice(number)}
              >
                Làm 問{number}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="exam-questions">
        {paper.questions.map((item) => {
          const off = !activeIds.has(item.id);
          return (
            <div className={`exam-q${off ? " off" : ""}`} key={item.id}>
              <div className="exam-q-head">
                <span className={`exam-q-no${isPartB(item) ? " partb" : ""}`}>
                  {item.question}
                </span>
                <span className="exam-q-name ja" title={item.name}>
                  {item.name}
                </span>
                <Stars count={item.stars} />
                <button
                  className="icon-btn"
                  title="Mở đề bài trên denken-ou.com"
                  onClick={() => openLink(item.url)}
                >
                  ↗
                </button>
              </div>

              {off ? (
                <div className="small dim">Không làm câu này</div>
              ) : (
                <div className="exam-choices">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      className={`exam-choice${picks[item.id] === value ? " on" : ""}`}
                      onClick={() => onPick(item.id, value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Kết quả                                                             */
/* ------------------------------------------------------------------ */

function ExamResult({
  exam,
  scores,
  papers,
  picks,
  choice,
  onAgain,
  onSave,
}: {
  exam: string;
  scores: SubjectScore[];
  papers: ExamPaper[];
  picks: Record<string, number>;
  choice: Partial<Record<SubjectKey, number>>;
  onAgain(): void;
  onSave(): void;
}) {
  const gradable = scores.filter((s) => s.correct + s.wrong + s.blank > 0);
  const allPassed = gradable.length > 0 && gradable.every((s) => s.passed);

  return (
    <div className="container">
      <div className={`card exam-verdict ${allPassed ? "pass" : "fail"}`}>
        <div className="exam-verdict-icon">{allPassed ? "🎉" : "📖"}</div>
        <div>
          <div className="exam-verdict-title">
            {gradable.length === 0
              ? "Chưa chấm được"
              : allPassed
                ? "Đạt!"
                : "Chưa đạt"}
          </div>
          <div className="muted">
            {gradable.length === 0
              ? "Đề này chưa có đáp án trong app nên không tính điểm được."
              : `Kỳ ${exam} · điểm đạt là ${PASS_MARK}/100 mỗi môn`}
          </div>
        </div>
      </div>

      <div className={`grid cols-${Math.min(4, Math.max(1, scores.length))}`}>
        {scores.map((score) => (
          <div className="card" key={score.subject}>
            <div className="row between" style={{ marginBottom: 10 }}>
              <span className="ja" style={{ fontWeight: 700 }}>
                {subjectName(score.subject)}
              </span>
              {score.correct + score.wrong + score.blank > 0 && (
                <span className={`pill ${score.passed ? "correct" : "wrong"}`}>
                  {score.passed ? "Đạt" : "Chưa đạt"}
                </span>
              )}
            </div>
            <div
              className={`stat-value ${score.passed ? "green" : "red"}`}
              style={{ fontSize: 34 }}
            >
              {score.correct + score.wrong + score.blank > 0 ? score.score : "—"}
              <span style={{ fontSize: 14, fontWeight: 600 }}> /100</span>
            </div>
            <div className="small muted" style={{ marginTop: 8, lineHeight: 1.8 }}>
              ✅ Đúng {score.correct} · ❌ Sai {score.wrong}
              {score.blank > 0 && ` · ⬜ Bỏ trống ${score.blank}`}
              {score.ungraded > 0 && (
                <>
                  <br />
                  <span className="dim">
                    {score.ungraded} câu chưa có đáp án, không tính điểm
                  </span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bảng đối chiếu từng câu để biết sai ở đâu */}
      {papers.map((paper) => {
        const list = questionsToAnswer(paper, choice[paper.subject] ?? null);
        return (
          <div className="card" key={paper.subject}>
            <div className="card-head">
              <div className="card-title ja">
                {subjectName(paper.subject)} — từng câu
              </div>
            </div>
            <div className="exam-review">
              {list.map((item) => {
                const truth = ANSWERS[item.id];
                const pick = picks[item.id];
                const state =
                  truth === undefined
                    ? "unknown"
                    : pick === undefined
                      ? "blank"
                      : pick === truth
                        ? "right"
                        : "wrong";
                return (
                  <div className={`exam-review-q ${state}`} key={item.id}>
                    <span className="mono">{item.question}</span>
                    <span className="exam-review-mark">
                      {state === "right"
                        ? "✅"
                        : state === "wrong"
                          ? "❌"
                          : state === "blank"
                            ? "⬜"
                            : "－"}
                    </span>
                    <span className="small dim">
                      {state === "unknown"
                        ? "chưa có đáp án"
                        : `bạn chọn ${pick ?? "—"} · đúng là ${truth}`}
                    </span>
                    <span className="spacer" />
                    <button
                      className="icon-btn"
                      title="Mở lời giải trên denken-ou.com"
                      onClick={() => openLink(item.url)}
                    >
                      ↗
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="card center">
        <div className="btn-row" style={{ justifyContent: "center" }}>
          <button className="btn primary" onClick={onSave}>
            💾 Lưu kết quả và quay lại
          </button>
          <button className="btn ghost" onClick={onAgain}>
            Không lưu, thi lại
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lịch sử thi                                                         */
/* ------------------------------------------------------------------ */

function ExamHistory({ store }: { store: Store }) {
  const results = store.data!.examResults;
  if (results.length === 0) return null;

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          Lịch sử thi thử
          <div className="card-sub">{results.length} lần</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[...results]
          .reverse()
          .slice(0, 20)
          .map((result) => (
            <div className="exam-history-row" key={result.id}>
              <span style={{ fontWeight: 700, minWidth: 64 }}>{result.exam}</span>
              <span className="small dim" style={{ minWidth: 96 }}>
                {result.takenAt.slice(0, 10)}
              </span>
              <div className="row wrap" style={{ gap: 6, flex: 1 }}>
                {result.scores.map((score) => (
                  <span
                    key={score.subject}
                    className={`pill ${score.passed ? "correct" : "wrong"}`}
                    title={`${score.correct}/${score.total} câu đúng`}
                  >
                    <span className="ja">{subjectName(score.subject)}</span>{" "}
                    {score.score}
                  </span>
                ))}
              </div>
              <button
                className="icon-btn"
                title="Xoá lần thi này"
                onClick={() => store.removeExamResult(result.id)}
              >
                🗑
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
