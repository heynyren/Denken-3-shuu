/**
 * Thi thử theo từng kỳ thi.
 *
 * Cách chấm điểm mô phỏng đề thật 電験三種, mỗi môn thang 100 điểm:
 *
 *   理論 / 電力 / 機械   A問題 (問1-14) 5 điểm/câu = 70
 *                        B問題            10 điểm/câu = 30
 *   法規                 A問題 (問1-10) 6 điểm/câu = 60
 *                        B問題 (問11-13) chia đều 40 điểm
 *
 * Thời gian làm bài:  理論 / 電力 / 機械  90 phút — 法規  65 phút
 *
 * Riêng 理論 và 機械 có 4 câu B問題 (問15-18) nhưng **chỉ được chọn một trong
 * 問17 hoặc 問18**, nên số câu thực sự tính điểm là 3.
 */

import { itemById, items } from "./catalog";
import { isPartB } from "./timing";
import type { CatalogItem, ExamAnswerRecord, SubjectKey } from "./types";

/**
 * Số ý của một câu. A問題 một ý, B問題 hai ý — đề thật hỏi (a) và (b) riêng,
 * mỗi ý một đáp án và tính điểm riêng, nên đúng một ý vẫn được nửa số điểm.
 */
export function subAnswerCount(item: CatalogItem): number {
  return isPartB(item) ? 2 : 1;
}

/** Nhãn của từng ý: A問題 không có nhãn, B問題 là (a) và (b). */
export const SUB_LABELS = ["(a)", "(b)"] as const;

/** Số phút cho mỗi môn. */
export const EXAM_MINUTES: Record<SubjectKey, number> = {
  riron: 90,
  denryoku: 90,
  kikai: 90,
  houki: 65,
};

/** Điểm đạt trên thang 100. Kỳ thi thật đôi khi hạ chuẩn, nhưng 60 là mốc gốc. */
export const PASS_MARK = 60;

/**
 * Số hiệu câu chuẩn của mỗi môn trong đề thật.
 * Câu nào mang số ngoài khoảng này là dữ liệu sai, không đưa vào đề thi thử.
 */
export const STANDARD_QUESTIONS: Record<SubjectKey, number> = {
  riron: 18,
  denryoku: 17,
  kikai: 18,
  houki: 13,
};

/** Hai môn này cho chọn một trong hai câu cuối. */
export const CHOICE_SUBJECTS: ReadonlySet<SubjectKey> = new Set(["riron", "kikai"]);
/** Cặp câu được chọn: làm 問17 hoặc 問18, không làm cả hai. */
export const CHOICE_PAIR = [17, 18] as const;

export function questionNo(item: CatalogItem): number {
  const match = /(\d+)/.exec(item.question);
  return match ? Number(match[1]) : 0;
}

/* ------------------------------------------------------------------ */
/* Gom bài theo kỳ thi                                                 */
/* ------------------------------------------------------------------ */

export interface ExamPaper {
  exam: string;
  subject: SubjectKey;
  /** Sắp theo số hiệu câu, đúng thứ tự trong đề. */
  questions: CatalogItem[];
  /** Có đủ cặp 問17/問18 để cho chọn hay không. */
  hasChoice: boolean;
}

export interface ExamSet {
  exam: string;
  papers: Partial<Record<SubjectKey, ExamPaper>>;
}

/** Xếp kỳ thi từ mới tới cũ: R07下 > R07上 > R06下 > … > H18. */
export function examOrder(exam: string): number {
  const match = /^([RH])0*(\d+)/.exec(exam);
  if (!match) return -1;
  const era = match[1] === "R" ? 1 : 0;
  const year = Number(match[2]);
  // 下期 thi sau 上期 trong cùng năm.
  const half = exam.includes("下") ? 2 : exam.includes("上") ? 1 : 0;
  return era * 100_000 + year * 10 + half;
}

/**
 * Dọn một đề: bỏ câu trùng, bỏ câu ngoài chuẩn.
 *
 * Danh mục có 26 chỗ trùng, chủ yếu vì một bài liên môn được liệt kê ở hai chủ
 * đề khác nhau — cùng link, cùng tên, nhưng thành hai dòng. Đưa nguyên vào đề
 * thi thử thì 法規 H18 có tới 15 câu và 問2 hiện ba lần.
 *
 * Khử theo hai vòng:
 *   1. Trùng link  -> chắc chắn cùng một bài, giữ một.
 *   2. Trùng số hiệu mà khác link -> giữ bài có link đúng môn. Ví dụ 法規 R4下
 *      問11 có một dòng mang link denryoku…, đó là bài của môn 電力 bị xếp nhầm.
 */
function tidyPaper(subject: SubjectKey, questions: CatalogItem[]): CatalogItem[] {
  const byUrl = new Map<string, CatalogItem>();
  for (const item of questions) {
    const key = item.url || item.id;
    if (!byUrl.has(key)) byUrl.set(key, item);
  }

  const byNumber = new Map<number, CatalogItem>();
  for (const item of byUrl.values()) {
    const number = questionNo(item);
    if (number < 1 || number > STANDARD_QUESTIONS[subject]) continue;

    const kept = byNumber.get(number);
    if (!kept) {
      byNumber.set(number, item);
      continue;
    }
    // Link bắt đầu bằng tên môn thì mới là bài của môn này.
    const belongs = (entry: CatalogItem) =>
      entry.url.toLowerCase().includes(`/${subject}`);
    if (!belongs(kept) && belongs(item)) byNumber.set(number, item);
  }

  return [...byNumber.values()].sort((a, b) => questionNo(a) - questionNo(b));
}

/** Toàn bộ kỳ thi có trong danh mục, mới nhất trước. */
export const examSets: ExamSet[] = (() => {
  const grouped = new Map<string, ExamSet>();

  for (const item of items) {
    if (!item.exam) continue;
    let set = grouped.get(item.exam);
    if (!set) {
      set = { exam: item.exam, papers: {} };
      grouped.set(item.exam, set);
    }
    const paper = (set.papers[item.subject] ??= {
      exam: item.exam,
      subject: item.subject,
      questions: [],
      hasChoice: false,
    });
    paper.questions.push(item);
  }

  for (const set of grouped.values()) {
    for (const paper of Object.values(set.papers)) {
      paper.questions = tidyPaper(paper.subject, paper.questions);
      const numbers = new Set(paper.questions.map(questionNo));
      paper.hasChoice =
        CHOICE_SUBJECTS.has(paper.subject) &&
        CHOICE_PAIR.every((n) => numbers.has(n));
    }
  }

  return [...grouped.values()].sort((a, b) => examOrder(b.exam) - examOrder(a.exam));
})();

export function findExamSet(exam: string): ExamSet | undefined {
  return examSets.find((set) => set.exam === exam);
}

/* ------------------------------------------------------------------ */
/* Điểm từng câu                                                       */
/* ------------------------------------------------------------------ */

/**
 * Điểm của một câu, tính sao cho tổng cả đề đúng 100.
 *
 * Nhận cả bài đề vào để biết môn đó có bao nhiêu câu B — nếu một kỳ thiếu câu
 * thì vẫn chia đều phần điểm B, thay vì trả về tổng lệch khỏi 100.
 */
export function pointsFor(item: CatalogItem, paper: ExamPaper): number {
  const partB = isPartB(item);

  if (item.subject === "houki") {
    if (!partB) return 6;
    const bCount = paper.questions.filter(isPartB).length || 1;
    return 40 / bCount;
  }

  if (!partB) return 5;
  // 理論/機械 có 4 câu B nhưng chỉ tính 3 vì được chọn một trong 17/18.
  const bCount = paper.questions.filter(isPartB).length || 1;
  const scored = paper.hasChoice ? bCount - 1 : bCount;
  return 30 / Math.max(1, scored);
}

/** Những câu thí sinh phải làm, sau khi đã chọn 17 hay 18. */
export function questionsToAnswer(
  paper: ExamPaper,
  choice: number | null,
): CatalogItem[] {
  if (!paper.hasChoice) return paper.questions;
  const dropped = choice === CHOICE_PAIR[1] ? CHOICE_PAIR[0] : CHOICE_PAIR[1];
  return paper.questions.filter((item) => questionNo(item) !== dropped);
}

/* ------------------------------------------------------------------ */
/* Chấm điểm                                                           */
/* ------------------------------------------------------------------ */

export interface SubjectScore {
  subject: SubjectKey;
  /** Điểm đạt được trên thang 100. */
  score: number;
  correct: number;
  wrong: number;
  /** Câu bỏ trống. */
  blank: number;
  /** Câu chưa có đáp án trong bảng đáp án, không chấm được. */
  ungraded: number;
  total: number;
  passed: boolean;
  /** Bài làm từng câu, để dựng bảng phân tích và thống kê chỗ yếu. */
  answers: ExamAnswerRecord[];
}

/**
 * Lựa chọn của người thi và đáp án đúng đều là mảng theo từng ý:
 * A問題 một phần tử, B問題 hai phần tử.
 */
export type Picks = Record<string, (number | undefined)[]>;
export type AnswerKey = Record<string, number[]>;

export interface GradeInput {
  paper: ExamPaper;
  choice: number | null;
  picks: Picks;
  /** Thiếu id nào, hoặc thiếu ý nào, thì phần đó không chấm được. */
  answers: AnswerKey;
}

export function gradePaper({
  paper,
  choice,
  picks,
  answers,
}: GradeInput): SubjectScore {
  const questions = questionsToAnswer(paper, choice);

  const records: ExamAnswerRecord[] = [];
  let score = 0;
  let correct = 0;
  let wrong = 0;
  let blank = 0;
  let ungraded = 0;
  // Điểm chỉ tính trên phần chấm được, rồi quy về thang 100. Nếu bảng đáp án
  // mới có một nửa số câu thì chấm trên nửa đó chứ không coi nửa kia là sai.
  let gradablePoints = 0;

  for (const item of questions) {
    const subs = subAnswerCount(item);
    const truth = answers[item.id] ?? [];
    // Điểm cả câu chia đều cho từng ý: B問題 10 điểm thì mỗi ý 5 điểm, nên
    // đúng một ý vẫn được nửa số điểm, giống cách chấm của đề thật.
    const perSub = pointsFor(item, paper) / subs;

    const record: ExamAnswerRecord = { id: item.id, picked: [], truth: [] };
    for (let index = 0; index < subs; index += 1) {
      const answer = truth[index];
      const pick = picks[item.id]?.[index];
      record.picked.push(pick ?? null);
      record.truth.push(answer ?? null);

      if (answer === undefined) {
        ungraded += 1;
        continue;
      }
      gradablePoints += perSub;

      if (pick === undefined) blank += 1;
      else if (pick === answer) {
        correct += 1;
        score += perSub;
      } else wrong += 1;
    }
    records.push(record);
  }

  const scaled = gradablePoints > 0 ? (score / gradablePoints) * 100 : 0;
  return {
    subject: paper.subject,
    score: Math.round(scaled * 10) / 10,
    correct,
    wrong,
    blank,
    ungraded,
    // Đếm theo ý chứ không theo câu, vì B問題 hai ý chấm riêng từng ý.
    total: questions.reduce((sum, item) => sum + subAnswerCount(item), 0),
    passed: gradablePoints > 0 && scaled >= PASS_MARK,
    answers: records,
  };
}

/* ------------------------------------------------------------------ */
/* Phân tích một lượt thi                                              */
/* ------------------------------------------------------------------ */

/** Kết quả của một ý trong bảng phân tích. */
export type SubState = "right" | "wrong" | "blank" | "unknown";

export function subState(
  picked: number | null | undefined,
  truth: number | null | undefined,
): SubState {
  if (truth === null || truth === undefined) return "unknown";
  if (picked === null || picked === undefined) return "blank";
  return picked === truth ? "right" : "wrong";
}

/** Một chủ đề trong bảng phân tích của lượt thi. */
export interface TopicScore {
  topic: string;
  subject: SubjectKey;
  /** Số ý chấm được (bỏ qua ý chưa có đáp án). */
  graded: number;
  correct: number;
  wrong: number;
  blank: number;
  /** Số câu của chủ đề đó ra trong đề này. */
  questions: number;
  /** Tỉ lệ đúng trên phần chấm được, 0..1. */
  ratio: number;
}

/**
 * Đúng bao nhiêu phần trăm ở từng chủ đề trong lượt thi này.
 *
 * Mẫu số là số ý của chủ đề đó **ra trong chính đề này** và chấm được, nên đọc
 * được ngay "chủ đề nào vừa mất điểm", chứ không pha loãng với các đề khác.
 * Chủ đề yếu xếp lên trước, chủ đề chưa chấm được xuống cuối.
 */
export function topicBreakdown(records: ExamAnswerRecord[]): TopicScore[] {
  const byTopic = new Map<string, TopicScore>();

  for (const record of records) {
    const item = itemById.get(record.id);
    if (!item) continue;
    const key = `${item.subject} ${item.topic}`;
    const row =
      byTopic.get(key) ??
      ({
        topic: item.topic,
        subject: item.subject,
        graded: 0,
        correct: 0,
        wrong: 0,
        blank: 0,
        questions: 0,
        ratio: 0,
      } satisfies TopicScore);
    row.questions += 1;

    record.truth.forEach((truth, index) => {
      const state = subState(record.picked[index], truth);
      if (state === "unknown") return;
      row.graded += 1;
      if (state === "right") row.correct += 1;
      else if (state === "wrong") row.wrong += 1;
      else row.blank += 1;
    });

    byTopic.set(key, row);
  }

  return [...byTopic.values()]
    .map((row) => ({ ...row, ratio: row.graded > 0 ? row.correct / row.graded : 0 }))
    .sort((a, b) => {
      // Chủ đề chưa chấm được xuống cuối, còn lại yếu nhất lên đầu.
      if (a.graded === 0 !== (b.graded === 0)) return a.graded === 0 ? 1 : -1;
      if (a.ratio !== b.ratio) return a.ratio - b.ratio;
      return b.graded - a.graded;
    });
}

/** 5400 -> "90:00" */
export function formatExamClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
