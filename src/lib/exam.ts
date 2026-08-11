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

import { items } from "./catalog";
import { isPartB } from "./timing";
import type { CatalogItem, SubjectKey } from "./types";

/** Số phút cho mỗi môn. */
export const EXAM_MINUTES: Record<SubjectKey, number> = {
  riron: 90,
  denryoku: 90,
  kikai: 90,
  houki: 65,
};

/** Điểm đạt trên thang 100. Kỳ thi thật đôi khi hạ chuẩn, nhưng 60 là mốc gốc. */
export const PASS_MARK = 60;

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
      paper.questions.sort((a, b) => questionNo(a) - questionNo(b));
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
}

export interface GradeInput {
  paper: ExamPaper;
  choice: number | null;
  /** id bài -> lựa chọn 1..5 của người thi. */
  picks: Record<string, number>;
  /** id bài -> đáp án đúng 1..5. Thiếu id nào thì câu đó không chấm được. */
  answers: Record<string, number>;
}

export function gradePaper({
  paper,
  choice,
  picks,
  answers,
}: GradeInput): SubjectScore {
  const questions = questionsToAnswer(paper, choice);

  let score = 0;
  let correct = 0;
  let wrong = 0;
  let blank = 0;
  let ungraded = 0;
  // Điểm chỉ tính trên phần chấm được, rồi quy về thang 100. Nếu bảng đáp án
  // mới có một nửa số câu thì chấm trên nửa đó chứ không coi nửa kia là sai.
  let gradablePoints = 0;

  for (const item of questions) {
    const truth = answers[item.id];
    if (truth === undefined) {
      ungraded += 1;
      continue;
    }
    const points = pointsFor(item, paper);
    gradablePoints += points;

    const pick = picks[item.id];
    if (pick === undefined) blank += 1;
    else if (pick === truth) {
      correct += 1;
      score += points;
    } else wrong += 1;
  }

  const scaled = gradablePoints > 0 ? (score / gradablePoints) * 100 : 0;
  return {
    subject: paper.subject,
    score: Math.round(scaled * 10) / 10,
    correct,
    wrong,
    blank,
    ungraded,
    total: questions.length,
    passed: gradablePoints > 0 && scaled >= PASS_MARK,
  };
}

/** 5400 -> "90:00" */
export function formatExamClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
