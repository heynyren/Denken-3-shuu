/**
 * Thi thử theo từng kỳ thi.
 *
 * Ba bước: chọn đề → làm bài (có bấm giờ) → xem kết quả.
 * Luật thi mô phỏng đề thật, xem src/lib/exam.ts.
 */

import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  Coffee,
  PartyPopper,
  Save,
  SquarePen,
  Trash2,
  X,
} from "lucide-react";
import { Ic } from "../components/ui/icon";
import { useEffect, useMemo, useRef, useState } from "react";

import { AttemptAnalysis, QuestionTable, TopicTable } from "../components/ExamAnalysis";
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
  subAnswerCount,
  SUB_LABELS,
} from "../lib/exam";
import type { AnswerKey, ExamPaper, Picks, SubjectScore } from "../lib/exam";
import { isPartB } from "../lib/timing";
import type { SubjectKey } from "../lib/types";
import { platform } from "../platform";
import { ALARM_EXAM } from "../platform/types";
import type { Store } from "../state/useStore";

const ANSWERS = (answersFile as { answers: AnswerKey }).answers;

/**
 * Bốn bước: chọn đề → làm một môn → nghỉ giữa hai môn → xem kết quả.
 *
 * Chọn nhiều môn thì **thi lần lượt**, mỗi môn một đồng hồ riêng đúng bằng thời
 * gian của môn đó. Không gộp thời gian các môn lại thành một đồng hồ chung: ở
 * kỳ thi thật hết giờ môn nào là nộp môn đó, không được mượn thời gian môn sau.
 */
type Stage = "setup" | "running" | "break" | "result";

/** Thời gian của một môn, tính bằng giây. */
function paperSeconds(subject: SubjectKey): number {
  return EXAM_MINUTES[subject] * 60;
}

export default function Exam({
  store,
  onOpenTopic,
}: {
  store: Store;
  /** Bấm "Ôn lại" ở bảng phân tích thì nhảy sang màn Ôn tập với cả chủ đề đó. */
  onOpenTopic(subject: SubjectKey, topic: string): void;
}) {
  const [stage, setStage] = useState<Stage>("setup");
  const [exam, setExam] = useState(examSets[0]?.exam ?? "");
  const [chosen, setChosen] = useState<SubjectKey[]>(["riron"]);

  // Bài làm: id bài -> lựa chọn từng ý. A問題 một ý, B問題 hai ý (a) và (b).
  const [picks, setPicks] = useState<Picks>({});
  // 理論/機械 chỉ được làm một trong 問17 hoặc 問18
  const [choice, setChoice] = useState<Partial<Record<SubjectKey, number>>>({});
  const [scores, setScores] = useState<SubjectScore[]>([]);
  /** Đang thi tới môn thứ mấy trong danh sách đã chọn. */
  const [step, setStep] = useState(0);

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

  /** Bao nhiêu Ý của đề đang chọn đã có đáp án — đếm theo ý vì B問題 có hai ý. */
  const coverage = useMemo(() => {
    let total = 0;
    let graded = 0;
    for (const paper of papers) {
      for (const item of paper.questions) {
        const subs = subAnswerCount(item);
        total += subs;
        const truth = ANSWERS[item.id] ?? [];
        for (let i = 0; i < subs; i += 1) if (truth[i] !== undefined) graded += 1;
      }
    }
    return { total, graded };
  }, [papers]);

  const current = papers[step];
  const next = papers[step + 1];

  /* ---------------- đồng hồ ---------------- */

  // Hết giờ thì tự nộp môn đang làm. Giữ trong ref để đồng hồ luôn gọi bản mới
  // nhất, không kẹt lại bài làm của lần render cũ.
  const submitRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (endsAt === null) return;
    const tick = () => {
      const remain = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setLeft(remain);
      if (remain === 0) {
        setEndsAt(null);
        alarm.current.start();
        submitRef.current();
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [endsAt]);

  const alarmRef = alarm.current;
  useEffect(() => () => alarmRef.stop(), [alarmRef]);

  /* ---------------- các bước ---------------- */

  /** Mở đồng hồ riêng cho một môn rồi vào phòng thi. */
  const startPaper = (index: number) => {
    const paper = papers[index];
    if (!paper) return;
    alarm.current.stop();
    setStep(index);
    const at = Date.now() + paperSeconds(paper.subject) * 1000;
    setEndsAt(at);
    // Lời nhắc của hệ điều hành: đang thi mà lỡ thoát ra hay tắt màn hình thì
    // vẫn biết là hết giờ môn này.
    void platform.notifyAt(
      ALARM_EXAM,
      at,
      `Hết giờ ${subjectViName(paper.subject)}`,
      "Bài đã tự nộp. Mở app xem điểm nhé.",
    );
    setStage("running");
  };

  const begin = () => {
    if (papers.length === 0) return;
    setPicks({});
    setScores([]);
    setChoice(
      Object.fromEntries(
        papers.filter((p) => p.hasChoice).map((p) => [p.subject, CHOICE_PAIR[0]]),
      ),
    );
    startPaper(0);
  };

  /**
   * Nộp môn đang làm: chấm ngay môn đó rồi sang phòng chờ, hoặc ra kết quả nếu
   * đây là môn cuối. Chấm từng môn một nên điểm không phụ thuộc vào việc các
   * môn sau có làm hay không.
   */
  const submitPaper = () => {
    if (!current) return;
    const score = gradePaper({
      paper: current,
      choice: choice[current.subject] ?? null,
      picks,
      answers: ANSWERS,
    });
    setScores((list) => [...list.filter((s) => s.subject !== score.subject), score]);
    setEndsAt(null);
    void platform.cancelNotify(ALARM_EXAM);
    setStage(next ? "break" : "result");
  };
  submitRef.current = submitPaper;

  const quit = () => {
    alarm.current.stop();
    void platform.cancelNotify(ALARM_EXAM);
    setEndsAt(null);
    setStep(0);
    setScores([]);
    setStage("setup");
  };

  const leaveResult = (after: () => void) => {
    alarm.current.stop();
    setStep(0);
    after();
  };

  /* ================= chọn đề ================= */

  if (stage === "setup") {
    const gradedRatio = coverage.total > 0 ? coverage.graded / coverage.total : 0;

    return (
      <div className="container">
        <div className="card">
          <div className="card-head">
            <div className="card-title">
              <Ic i={SquarePen} /> Thi thử
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

          {papers.length > 0 && (
            <div className="callout" style={{ marginTop: 16 }}>
              Thi <strong>lần lượt từng môn</strong>, xong môn này mới sang môn kia:
              <div className="exam-order">
                {papers.map((paper, index) => (
                  <span className="exam-order-step" key={paper.subject}>
                    {index > 0 && <span className="dim">→</span>}
                    <span className="ja">{subjectName(paper.subject)}</span>
                    <span className="small dim">
                      {EXAM_MINUTES[paper.subject]} phút
                    </span>
                  </span>
                ))}
              </div>
              Mỗi môn có đồng hồ riêng, <strong>không cộng dồn thời gian</strong> — hết
              giờ môn nào là nộp môn đó. Điểm đạt là <strong>{PASS_MARK}/100</strong>{" "}
              mỗi môn.
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
                  ý (B問題 mỗi câu 2 ý). Điểm sẽ được quy về thang 100 trên phần chấm được, số câu còn
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

        <ExamHistory store={store} onOpenTopic={onOpenTopic} />
      </div>
    );
  }

  /* ================= đang làm bài ================= */

  if (stage === "running" && current) {
    // Chỉ đếm trong môn đang thi — môn sau chưa mở nên không tính vào đây.
    const need = questionsToAnswer(current, choice[current.subject] ?? null);
    const needIds = new Set(need.map((item) => item.id));
    const answered = Object.entries(picks).reduce(
      (sum, [id, list]) =>
        needIds.has(id)
          ? sum + list.filter((value) => value !== undefined).length
          : sum,
      0,
    );
    const needCount = need.reduce((sum, item) => sum + subAnswerCount(item), 0);

    return (
      <div className="container">
        <div className="exam-bar">
          <Ring
            ratio={left / paperSeconds(current.subject)}
            size={64}
            width={7}
            color={left <= 300 ? "var(--red)" : "var(--blue)"}
          >
            <div className="exam-clock">{formatExamClock(left)}</div>
          </Ring>
          <div className="exam-bar-text">
            <div style={{ fontWeight: 700 }}>
              {exam} — <span className="ja">{subjectName(current.subject)}</span>
              {papers.length > 1 && (
                <span className="small dim">
                  {" "}
                  (môn {step + 1}/{papers.length})
                </span>
              )}
            </div>
            <div className="small muted">
              Đã trả lời {answered}/{needCount} ý
              {left <= 300 && " · sắp hết giờ!"}
            </div>
          </div>
          <button className="btn success" onClick={submitPaper}>
            {next ? "Nộp môn này" : "Nộp bài"}
          </button>
          <button className="btn ghost sm" onClick={quit}>
            Thoát
          </button>
        </div>

        <PaperSheet
          paper={current}
          picks={picks}
          onPick={(id, index, value) =>
            setPicks((list) => {
              const row = [...(list[id] ?? [])];
              row[index] = value;
              return { ...list, [id]: row };
            })
          }
          choice={choice[current.subject] ?? null}
          onChoice={(value) =>
            setChoice((c) => ({ ...c, [current.subject]: value }))
          }
        />

        <div className="card center">
          <button className="btn success lg" onClick={submitPaper}>
            {next ? (
              <>
                Nộp <span className="ja">{subjectName(current.subject)}</span> và sang{" "}
                <span className="ja">{subjectName(next.subject)}</span> →
              </>
            ) : (
              "Nộp bài và xem điểm"
            )}
          </button>
          {next && (
            <div className="small dim" style={{ marginTop: 10 }}>
              Nộp rồi là không quay lại sửa được, giống phòng thi thật.
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ================= nghỉ giữa hai môn ================= */

  if (stage === "break" && next) {
    const justDone = papers[step];
    return (
      <div className="container">
        <div className="card center exam-break">
          <div className="exam-break-icon">
            <Coffee className="h-9 w-9" strokeWidth={1.25} />
          </div>
          <div className="exam-break-title">
            Xong <span className="ja">{justDone && subjectName(justDone.subject)}</span>
          </div>
          <p className="muted">
            Nghỉ một chút rồi thi tiếp. Môn sau có đồng hồ riêng, bấm nút mới bắt đầu
            tính giờ — thời gian nghỉ không bị trừ vào bài.
          </p>

          <div className="exam-order" style={{ justifyContent: "center" }}>
            {papers.map((paper, index) => (
              <span
                className={`exam-order-step${
                  index < step + 1 ? " done" : index === step + 1 ? " now" : ""
                }`}
                key={paper.subject}
              >
                {index > 0 && <span className="dim">→</span>}
                <span className="ja">{subjectName(paper.subject)}</span>
                <span className="small dim">
                  {index < step + 1 ? "đã nộp" : `${EXAM_MINUTES[paper.subject]} phút`}
                </span>
              </span>
            ))}
          </div>

          <div className="btn-row" style={{ justifyContent: "center", marginTop: 18 }}>
            <button className="btn primary lg" onClick={() => startPaper(step + 1)}>
              Bắt đầu <span className="ja">{subjectName(next.subject)}</span> —{" "}
              {EXAM_MINUTES[next.subject]} phút →
            </button>
            <button
              className="btn ghost"
              onClick={() => {
                alarm.current.stop();
                setStage("result");
              }}
            >
              Dừng ở đây, xem điểm
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ================= kết quả ================= */

  return (
    <ExamResult
      exam={exam}
      scores={scores}
      onOpenTopic={onOpenTopic}
      onAgain={() => leaveResult(() => setStage("setup"))}
      onSave={() =>
        leaveResult(() => {
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
              // Bài làm từng câu: đây là thứ dựng nên bảng phân tích khi mở
              // lại lượt thi này, và cũng là dữ liệu cho mục "đang yếu ở đâu".
              answers: s.answers,
            })),
          });
          setStage("setup");
        })
      }
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
  picks: Picks;
  onPick(id: string, index: number, value: number): void;
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
                // B問題 hai ý, mỗi ý một hàng lựa chọn riêng.
                Array.from({ length: subAnswerCount(item) }, (_, index) => (
                  <div className="exam-choices" key={index}>
                    {subAnswerCount(item) > 1 && (
                      <span className="exam-sub-label">{SUB_LABELS[index]}</span>
                    )}
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        className={`exam-choice${
                          picks[item.id]?.[index] === value ? " on" : ""
                        }`}
                        onClick={() => onPick(item.id, index, value)}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                ))
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
  onOpenTopic,
  onAgain,
  onSave,
}: {
  exam: string;
  scores: SubjectScore[];
  onOpenTopic?(subject: SubjectKey, topic: string): void;
  onAgain(): void;
  onSave(): void;
}) {
  const gradable = scores.filter((s) => s.correct + s.wrong + s.blank > 0);
  const allPassed = gradable.length > 0 && gradable.every((s) => s.passed);

  return (
    <div className="container">
      <div className={`card exam-verdict ${allPassed ? "pass" : "fail"}`}>
        <div className="exam-verdict-icon">
            {allPassed ? (
              <PartyPopper className="h-9 w-9" strokeWidth={1.25} />
            ) : (
              <BookOpen className="h-9 w-9" strokeWidth={1.25} />
            )}
          </div>
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
              <Ic i={Check} className="h-3.5 w-3.5" /> Đúng {score.correct} ·{" "}
                  <Ic i={X} className="h-3.5 w-3.5" /> Sai {score.wrong}
              {score.blank > 0 && (
                    <>
                      {" · "}
                      <Ic i={CircleDashed} className="h-3.5 w-3.5" /> Bỏ trống{" "}
                      {score.blank}
                    </>
                  )}
              <br />
              <span className="dim">tính theo ý — B問題 mỗi câu 2 ý</span>
              {score.ungraded > 0 && (
                <>
                  <br />
                  <span className="dim">
                    {score.ungraded} ý chưa có đáp án, không tính điểm
                  </span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Phân tích: chủ đề nào yếu, rồi tới từng câu sai ở đâu */}
      {scores.map((score) => (
        <div className="card" key={score.subject}>
          <div className="card-head">
            <div className="card-title">
              <span className="ja">{subjectName(score.subject)}</span> — phân tích
              <div className="card-sub">
                Đúng bao nhiêu phần trăm ở từng chủ đề vừa ra trong đề này
              </div>
            </div>
          </div>

          <TopicTable records={score.answers} onOpenTopic={onOpenTopic} />

          <div className="small dim" style={{ margin: "16px 0 6px" }}>
            Từng câu — bạn chọn gì, đáp án đúng là gì
          </div>
          <QuestionTable records={score.answers} />
        </div>
      ))}

      <div className="card center">
        <div className="btn-row" style={{ justifyContent: "center" }}>
          <button className="btn primary" onClick={onSave}>
            <Ic i={Save} /> Lưu kết quả và quay lại
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

function ExamHistory({
  store,
  onOpenTopic,
}: {
  store: Store;
  onOpenTopic?(subject: SubjectKey, topic: string): void;
}) {
  const results = store.data!.examResults;
  // Mở một lượt để soi chi tiết; mở cái khác thì cái đang mở tự đóng.
  const [openId, setOpenId] = useState<string | null>(null);
  if (results.length === 0) return null;

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          Lịch sử thi thử
          <div className="card-sub">
            {results.length} lần · bấm vào một lượt để xem phân tích từng câu
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[...results]
          .reverse()
          .slice(0, 20)
          .map((result) => {
            const open = openId === result.id;
            return (
              <div key={result.id}>
                <div
                  className={`exam-history-row${open ? " open" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setOpenId(open ? null : result.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setOpenId(open ? null : result.id);
                    }
                  }}
                >
                  <span className="history-caret">
                  <Ic i={open ? ChevronDown : ChevronRight} className="h-4 w-4" />
                </span>
                  <span style={{ fontWeight: 700, minWidth: 64 }}>{result.exam}</span>
                  <span className="small dim" style={{ minWidth: 96 }}>
                    {result.takenAt.slice(0, 10)}
                  </span>
                  <div className="row wrap" style={{ gap: 6, flex: 1 }}>
                    {result.scores.map((score) => (
                      <span
                        key={score.subject}
                        className={`pill ${score.passed ? "correct" : "wrong"}`}
                        title={`${score.correct}/${score.total} ý đúng`}
                      >
                        <span className="ja">{subjectName(score.subject)}</span>{" "}
                        {score.score}
                      </span>
                    ))}
                  </div>
                  <button
                    className="icon-btn"
                    title="Xoá lần thi này"
                    onClick={(event) => {
                      event.stopPropagation();
                      store.removeExamResult(result.id);
                    }}
                  >
                    <Ic i={Trash2} />
                  </button>
                </div>

                {open && (
                  <AttemptAnalysis result={result} onOpenTopic={onOpenTopic} />
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
