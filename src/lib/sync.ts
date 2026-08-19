/**
 * Gộp dữ liệu giữa máy tính và điện thoại.
 *
 * Đây là phần dễ làm mất dữ liệu nhất của cả dự án, nên viết tách hẳn ra: không
 * đụng tới mạng, không đụng tới file, chỉ là hàm thuần — đưa vào ba bản dữ liệu,
 * trả về một bản. Nhờ vậy kiểm thử được từng luật một.
 *
 * Gộp BA CHIỀU, không phải hai
 * ----------------------------
 * Mỗi máy nhớ lại bản nó đã đẩy lên lần trước (`base`). Khi đồng bộ:
 *
 *     base    bản chung của lần trước
 *     local   máy này bây giờ
 *     remote  bản đang nằm trên Drive
 *
 * Có `base` mới phân biệt được "máy này vừa sửa" với "máy kia vừa sửa" — thiếu
 * nó thì mọi khác biệt đều trông giống nhau và chỉ còn cách đoán.
 *
 * Vì sao KHÔNG cộng thẳng dailyLog
 * --------------------------------
 * Tưởng chừng "10 bài trên điện thoại + 20 bài trên máy tính = 30" thì cứ cộng
 * hai bên là xong. Nhưng cộng tổng thì lần đồng bộ sau sẽ ra 60, rồi 120 — mỗi
 * lần đồng bộ lại nhân đôi. Phải cộng **phần chênh so với `base`**:
 *
 *     kết quả = remote + (local - base)
 *
 * Cũng không dựng lại dailyLog từ `history` được: history chỉ giữ 50 lần gần
 * nhất mỗi bài, dựng lại là mất sạch thống kê cũ.
 */

import type {
  AppData,
  DayLog,
  ExamResult,
  ItemProgress,
  Settings,
  SubjectKey,
} from "./types";

export interface MergeReport {
  /** Bài lấy theo máy này / theo máy kia. */
  progressLocal: number;
  progressRemote: number;
  /** Ngày có cộng thêm phần mới của máy này. */
  daysMerged: number;
  badgesAdded: number;
  examsAdded: number;
  examsRemoved: number;
  settingsFrom: "local" | "remote" | "same";
  /** Bài sửa ở cả hai bên kể từ lần đồng bộ trước — bên mới hơn thắng. */
  conflicts: string[];
}

export interface MergeResult {
  data: AppData;
  report: MergeReport;
}

/** Chuỗi ISO nào mới hơn. Chuỗi rỗng/thiếu coi như cũ nhất. */
function newer(a: string | undefined, b: string | undefined): boolean {
  return (a ?? "") > (b ?? "");
}

/* ------------------------------------------------------------------ */
/* Tiến độ từng bài                                                    */
/* ------------------------------------------------------------------ */

/**
 * Những trường do việc CHẤM BÀI sinh ra. Luôn đi thành MỘT KHỐI.
 *
 * Trạng thái, cấp độ ôn, ngày ôn lại và lịch sử phải khớp với nhau — lấy trạng
 * thái của máy này ghép với ngày ôn lại của máy kia là ra một bản ghi không bao
 * giờ tồn tại trên máy nào cả.
 */
function khoiOnTap(p: ItemProgress) {
  return {
    status: p.status,
    srsLevel: p.srsLevel,
    nextReview: p.nextReview,
    doneDate: p.doneDate,
    reviewedAt: p.reviewedAt,
    history: p.history,
  };
}

/**
 * Đồng hồ của riêng việc ôn: lần chấm bài gần nhất.
 *
 * Sổ ghi bằng bản cũ chưa có `reviewedAt` thì lùi về `doneDate` — thô hơn (chỉ
 * tới ngày) nhưng vẫn đúng hướng, và không làm hỏng gì so với trước.
 */
function mocOn(p: ItemProgress): string {
  return p.reviewedAt ?? (p.doneDate ? p.doneDate + "T00:00:00.000Z" : "");
}

/**
 * Gộp phần ÔN TẬP của hai bản cùng một bài, tách khỏi phép gộp cả bài.
 *
 * Vì sao phải tách: phép gộp thường lấy trọn bản có `updatedAt` mới hơn. Với
 * ghi chú và link thì đúng — bản viết sau là ý mới nhất của bạn. Nhưng tiến độ
 * ôn không phải thứ bạn gõ ra, nó do app ghi lại lúc bạn chấm bài, và hai máy
 * chấm vào hai lúc khác nhau. Chấm bài trên máy tính lên cấp 5, rồi mở bài đó
 * trên điện thoại chỉ để ghi thêm một dòng — bản của điện thoại mới hơn nên
 * thắng trọn, và cấp 5 tụt về cấp 1. Nhìn vào sổ chỉ thấy cấp 1, không có dấu
 * vết nào cho biết nó từng lên tới cấp 5.
 *
 * Nên so riêng bằng đồng hồ của chính việc ôn: `reviewedAt`. Bên nào CHẤM sau
 * thì cả KHỐI ôn tập của bên đó thắng — vẫn không trộn lẫn từng trường.
 */
function gopOnTap(win: ItemProgress, lose: ItemProgress): ItemProgress {
  if (mocOn(lose) <= mocOn(win)) return win;
  return { ...win, ...khoiOnTap(lose) };
}

/**
 * Mỗi bài là một đơn vị: bên nào có `updatedAt` mới hơn thì lấy trọn bản ghi
 * của bên đó — trừ khối ôn tập, xem `gopOnTap`.
 */
function mergeProgress(
  base: Record<string, ItemProgress>,
  local: Record<string, ItemProgress>,
  remote: Record<string, ItemProgress>,
  report: MergeReport,
): Record<string, ItemProgress> {
  const out: Record<string, ItemProgress> = {};

  for (const id of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    const here = local[id];
    const there = remote[id];

    if (!there) {
      out[id] = here!;
      report.progressLocal += 1;
      continue;
    }
    if (!here) {
      out[id] = there;
      report.progressRemote += 1;
      continue;
    }

    // Cùng sửa một bài ở hai nơi kể từ lần đồng bộ trước: có mất mát thật, nên
    // ghi lại để báo cho người dùng chứ không lặng lẽ bỏ một bên.
    const stamp = base[id]?.updatedAt;
    if (
      base[id] &&
      newer(here.updatedAt, stamp) &&
      newer(there.updatedAt, stamp) &&
      here.updatedAt !== there.updatedAt
    ) {
      report.conflicts.push(id);
    }

    if (newer(here.updatedAt, there.updatedAt)) {
      out[id] = gopOnTap(here, there);
      report.progressLocal += 1;
    } else {
      out[id] = gopOnTap(there, here);
      report.progressRemote += 1;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Nhật ký từng ngày                                                   */
/* ------------------------------------------------------------------ */

function emptyDay(): DayLog {
  return { reviewed: 0, correct: 0, wrong: 0, bySubject: {} };
}

function mergeSubjects(
  base: Partial<Record<SubjectKey, number>>,
  local: Partial<Record<SubjectKey, number>>,
  remote: Partial<Record<SubjectKey, number>>,
  hasBase: boolean,
): Partial<Record<SubjectKey, number>> {
  const out: Partial<Record<SubjectKey, number>> = {};
  const keys = new Set([
    ...Object.keys(local),
    ...Object.keys(remote),
  ]) as Set<SubjectKey>;

  for (const key of keys) {
    const here = local[key] ?? 0;
    const there = remote[key] ?? 0;
    out[key] = hasBase
      ? Math.max(0, there + (here - (base[key] ?? 0)))
      : Math.max(here, there);
  }
  return out;
}

/**
 * Cộng phần việc mới của máy này vào con số của máy kia.
 *
 * Chưa từng đồng bộ (`base` rỗng) thì không biết đâu là phần mới, nên lấy bên
 * lớn hơn. Thà thiếu còn hơn thừa: cộng đại hai bên sẽ thổi phồng chuỗi ngày
 * liên tiếp và mọi biểu đồ, mà con số thổi phồng thì không cách nào gỡ lại.
 */
function mergeDailyLog(
  base: Record<string, DayLog>,
  local: Record<string, DayLog>,
  remote: Record<string, DayLog>,
  hasBase: boolean,
  report: MergeReport,
): Record<string, DayLog> {
  const out: Record<string, DayLog> = {};

  for (const day of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    const here = local[day] ?? emptyDay();
    const there = remote[day] ?? emptyDay();
    const was = base[day] ?? emptyDay();

    if (!hasBase) {
      out[day] =
        here.reviewed >= there.reviewed
          ? { ...here, bySubject: mergeSubjects({}, here.bySubject, there.bySubject, false) }
          : { ...there, bySubject: mergeSubjects({}, here.bySubject, there.bySubject, false) };
      continue;
    }

    const add = (field: "reviewed" | "correct" | "wrong") =>
      Math.max(0, there[field] + (here[field] - was[field]));

    out[day] = {
      reviewed: add("reviewed"),
      correct: add("correct"),
      wrong: add("wrong"),
      bySubject: mergeSubjects(was.bySubject, here.bySubject, there.bySubject, true),
    };
    if (out[day].reviewed !== there.reviewed) report.daysMerged += 1;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Huy hiệu, lịch sử thi, cài đặt                                      */
/* ------------------------------------------------------------------ */

/** Huy hiệu chỉ có thêm, không bao giờ mất. Đạt sớm hơn thì giữ ngày sớm hơn. */
function mergeBadges(
  local: Record<string, string>,
  remote: Record<string, string>,
  report: MergeReport,
): Record<string, string> {
  const out = { ...remote };
  for (const [id, day] of Object.entries(local)) {
    if (!out[id]) {
      out[id] = day;
      report.badgesAdded += 1;
    } else if (day < out[id]) {
      out[id] = day;
    }
  }
  return out;
}

/**
 * Lịch sử thi gộp theo `id`. Lượt nào có trong `base` mà một bên đã bỏ đi thì
 * tôn trọng việc xoá đó — không thì lượt vừa xoá sẽ mọc lại sau mỗi lần đồng bộ.
 */
function mergeExams(
  base: ExamResult[],
  local: ExamResult[],
  remote: ExamResult[],
  hasBase: boolean,
  report: MergeReport,
): ExamResult[] {
  const baseIds = new Set(base.map((entry) => entry.id));
  const localIds = new Set(local.map((entry) => entry.id));
  const remoteIds = new Set(remote.map((entry) => entry.id));

  const out = new Map<string, ExamResult>();
  for (const entry of [...remote, ...local]) {
    if (hasBase && baseIds.has(entry.id)) {
      const deleted = !localIds.has(entry.id) || !remoteIds.has(entry.id);
      if (deleted) {
        report.examsRemoved += 1;
        continue;
      }
    }
    if (!out.has(entry.id)) out.set(entry.id, entry);
  }

  report.examsAdded = [...out.keys()].filter((id) => !remoteIds.has(id)).length;
  return [...out.values()].sort((a, b) => a.takenAt.localeCompare(b.takenAt));
}

/**
 * Cài đặt đi cả cụm: bên nào vừa sửa thì lấy bên đó, không sửa gì thì lấy máy kia.
 * Sửa cả hai bên thì máy này thắng — người đang ngồi trước máy vừa bấm nút đồng
 * bộ, lấy theo ý họ là ít bất ngờ nhất.
 */
function mergeSettings(
  base: Settings | null,
  local: Settings,
  remote: Settings,
  report: MergeReport,
): Settings {
  /**
   * So từng trường một, không so chuỗi JSON.
   *
   * `JSON.stringify` phụ thuộc thứ tự khoá, mà bản đọc từ file đi qua
   * `normalise()` nên thứ tự khoá do DEFAULT_SETTINGS quyết định — khác bản
   * dựng ở chỗ khác. Hai bộ cài đặt giống hệt nhau về nội dung vẫn bị coi là
   * khác, và hậu quả không nhỏ: mỗi máy đều tưởng cài đặt của mình mới hơn, nên
   * cứ năm phút lại ghi đè lẫn nhau một lần, không bao giờ dừng.
   */
  const same = (a: Settings, b: Settings) =>
    (Object.keys({ ...a, ...b }) as (keyof Settings)[]).every((key) => a[key] === b[key]);

  if (same(local, remote)) {
    report.settingsFrom = "same";
    return local;
  }
  if (base && same(local, base)) {
    report.settingsFrom = "remote";
    return remote;
  }
  report.settingsFrom = "local";
  // mirrorDir là đường dẫn trên đĩa của MÁY NÀY, mang sang máy kia là vô nghĩa.
  return { ...local, mirrorDir: local.mirrorDir };
}

/* ------------------------------------------------------------------ */
/* Gộp                                                                 */
/* ------------------------------------------------------------------ */

export function mergeData(
  base: AppData | null,
  local: AppData,
  remote: AppData,
): MergeResult {
  const report: MergeReport = {
    progressLocal: 0,
    progressRemote: 0,
    daysMerged: 0,
    badgesAdded: 0,
    examsAdded: 0,
    examsRemoved: 0,
    settingsFrom: "same",
    conflicts: [],
  };

  const hasBase = base !== null;

  const data: AppData = {
    schemaVersion: Math.max(local.schemaVersion, remote.schemaVersion),
    // Ngày tạo sổ là ngày sớm nhất trong hai máy.
    createdAt:
      local.createdAt < remote.createdAt ? local.createdAt : remote.createdAt,
    updatedAt: new Date().toISOString(),
    settings: mergeSettings(base?.settings ?? null, local.settings, remote.settings, report),
    progress: mergeProgress(base?.progress ?? {}, local.progress, remote.progress, report),
    dailyLog: mergeDailyLog(
      base?.dailyLog ?? {},
      local.dailyLog,
      remote.dailyLog,
      hasBase,
      report,
    ),
    badges: mergeBadges(local.badges, remote.badges, report),
    examResults: mergeExams(
      base?.examResults ?? [],
      local.examResults,
      remote.examResults,
      hasBase,
      report,
    ),
  };

  return { data, report };
}

/** Có gì để nói với người dùng sau khi gộp không. */
export function describeMerge(report: MergeReport): string {
  const parts: string[] = [];
  if (report.progressRemote > 0) parts.push(`${report.progressRemote} bài từ máy kia`);
  if (report.daysMerged > 0) parts.push(`${report.daysMerged} ngày được cộng thêm`);
  if (report.badgesAdded > 0) parts.push(`${report.badgesAdded} huy hiệu`);
  if (report.examsAdded > 0) parts.push(`${report.examsAdded} lượt thi`);
  if (parts.length === 0) return "Hai bên đã giống nhau, không có gì để gộp.";
  return "Đã gộp: " + parts.join(" · ");
}
