/* Kiểm thử luật gộp dữ liệu hai máy, đồng bộ GitHub, chuông báo hết giờ. */
import { syncOnce } from "../src/lib/cloud";
import type { SyncConfig } from "../src/lib/cloud";
import type { FetchLike } from "../src/lib/github";
import { fromBase64, toBase64, validRepo } from "../src/lib/github";
import { parseBackup } from "../src/lib/normalise";
import { mergeData } from "../src/lib/sync";
import type { AppData, ItemProgress } from "../src/lib/types";
import { safeName } from "../src/platform/android";
import { sideName } from "../src/platform/types";

let pass = 0;
let fail = 0;
const ok = (m: string) => { console.log("OK   " + m); pass += 1; };
const bad = (m: string) => { console.log("FAIL " + m); fail += 1; };
const check = (cond: boolean, m: string) => (cond ? ok(m) : bad(m));

function blank(): AppData {
  return {
    schemaVersion: 5,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    settings: { dailyGoal: 30, mirrorDir: "", examDate: "2027-03-21", backupsToKeep: 30 },
    progress: {},
    dailyLog: {},
    badges: {},
    examResults: [],
  };
}

function prog(status: ItemProgress["status"], updatedAt: string, level = 1): ItemProgress {
  return {
    status, notes: [], links: [], updatedAt,
    doneDate: updatedAt.slice(0, 10), srsLevel: level,
    nextReview: "2026-08-20", history: [{ date: updatedAt.slice(0, 10), result: "correct", level }],
  };
}

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

/* ---- 1. Bài sửa ở một bên: bên kia phải nhận được ---- */
{
  const base = blank();
  const pc = clone(base);
  const phone = clone(base);
  pc.progress["a"] = prog("correct", "2026-08-12T10:00:00Z");
  phone.progress["b"] = prog("wrong", "2026-08-12T11:00:00Z");

  const { data } = mergeData(base, pc, phone);
  check(!!data.progress["a"] && !!data.progress["b"], "bài của cả hai máy đều còn sau khi gộp");
}

/* ---- 2. Cùng một bài sửa hai nơi: bên mới hơn thắng, và có báo xung đột ---- */
{
  const base = blank();
  base.progress["a"] = prog("todo", "2026-08-10T00:00:00Z");
  const pc = clone(base);
  const phone = clone(base);
  pc.progress["a"] = prog("wrong", "2026-08-12T09:00:00Z");
  phone.progress["a"] = prog("correct", "2026-08-12T21:00:00Z");

  const { data, report } = mergeData(base, pc, phone);
  check(data.progress["a"].status === "correct", "cùng một bài sửa hai nơi: bản mới hơn thắng");
  check(report.conflicts.includes("a"), "có báo xung đột chứ không lặng lẽ bỏ một bên");
}

/* ---- 3. dailyLog: cộng phần mới, KHÔNG nhân đôi qua nhiều lần đồng bộ ---- */
{
  // Lần đồng bộ trước cả hai đang là 5 bài.
  const base = blank();
  base.dailyLog["2026-08-12"] = { reviewed: 5, correct: 4, wrong: 1, bySubject: { riron: 5 } };

  const pc = clone(base);
  pc.dailyLog["2026-08-12"] = { reviewed: 25, correct: 20, wrong: 5, bySubject: { riron: 25 } };  // +20
  const phone = clone(base);
  phone.dailyLog["2026-08-12"] = { reviewed: 15, correct: 12, wrong: 3, bySubject: { riron: 15 } }; // +10

  const first = mergeData(base, pc, phone);
  check(first.data.dailyLog["2026-08-12"].reviewed === 35,
    `gộp lần 1: 5 + 20 + 10 = 35 (được ${first.data.dailyLog["2026-08-12"].reviewed})`);
  check(first.data.dailyLog["2026-08-12"].bySubject.riron === 35, "bySubject cũng cộng đúng");

  // Đồng bộ lại ngay, không làm thêm bài nào: con số phải ĐỨNG YÊN.
  const merged = first.data;
  const second = mergeData(merged, clone(merged), clone(merged));
  check(second.data.dailyLog["2026-08-12"].reviewed === 35,
    `gộp lần 2 không làm thêm bài: vẫn 35 (được ${second.data.dailyLog["2026-08-12"].reviewed})`);

  // Máy kia làm thêm 3 bài rồi đồng bộ tiếp.
  const phone2 = clone(merged);
  phone2.dailyLog["2026-08-12"].reviewed = 38;
  const third = mergeData(merged, clone(merged), phone2);
  check(third.data.dailyLog["2026-08-12"].reviewed === 38,
    `gộp lần 3, máy kia làm thêm 3: ra 38 (được ${third.data.dailyLog["2026-08-12"].reviewed})`);
}

/* ---- 4. Lần đồng bộ đầu tiên (chưa có mốc): lấy bên lớn hơn, không cộng ---- */
{
  const pc = blank();
  const phone = blank();
  pc.dailyLog["2026-08-12"] = { reviewed: 20, correct: 20, wrong: 0, bySubject: { riron: 20 } };
  phone.dailyLog["2026-08-12"] = { reviewed: 12, correct: 10, wrong: 2, bySubject: { kikai: 12 } };

  const { data } = mergeData(null, pc, phone);
  check(data.dailyLog["2026-08-12"].reviewed === 20,
    `chưa từng đồng bộ: lấy bên lớn hơn (20), không cộng thành 32 (được ${data.dailyLog["2026-08-12"].reviewed})`);
}

/* ---- 5. Huy hiệu: chỉ thêm, giữ ngày sớm nhất ---- */
{
  const base = blank();
  const pc = clone(base);
  const phone = clone(base);
  pc.badges = { "first-step": "2026-05-01", "streak-7": "2026-08-01" };
  phone.badges = { "first-step": "2026-04-01" };

  const { data } = mergeData(base, pc, phone);
  check(data.badges["first-step"] === "2026-04-01", "huy hiệu giữ ngày đạt sớm nhất");
  check(data.badges["streak-7"] === "2026-08-01", "huy hiệu chỉ có ở một máy vẫn được giữ");
}

/* ---- 6. Lịch sử thi: gộp theo id, tôn trọng việc xoá ---- */
{
  const mk = (id: string, at: string) => ({
    id, exam: "R07下", takenAt: at,
    scores: [{ subject: "riron" as const, score: 70, correct: 14, total: 20, passed: true }],
  });
  const base = blank();
  base.examResults = [mk("e1", "2026-08-01T00:00:00Z"), mk("e2", "2026-08-02T00:00:00Z")];

  const pc = clone(base);
  pc.examResults = [mk("e1", "2026-08-01T00:00:00Z"), mk("e3", "2026-08-03T00:00:00Z")]; // xoá e2, thêm e3
  const phone = clone(base);

  const { data } = mergeData(base, pc, phone);
  const ids = data.examResults.map((e) => e.id).sort();
  check(JSON.stringify(ids) === JSON.stringify(["e1", "e3"]),
    `lượt thi đã xoá không mọc lại, lượt mới được thêm (được ${JSON.stringify(ids)})`);

  // Giao thức thật: máy tính gộp xong thì ĐẨY bản gộp lên Drive. Nên khi điện
  // thoại đồng bộ, remote là bản đã gộp (không còn e2), còn base của điện thoại
  // vẫn là bản cũ (có e2) -> phải hiểu là "máy kia đã xoá e2".
  const drive = data;
  const phoneAgain = mergeData(base, clone(phone), clone(drive));
  check(!phoneAgain.data.examResults.some((e) => e.id === "e2"),
    "điện thoại đồng bộ sau: nhận ra e2 đã bị xoá, không giữ lại");
  check(phoneAgain.data.examResults.some((e) => e.id === "e3"),
    "điện thoại đồng bộ sau: nhận được lượt thi e3 từ máy tính");
}

/* ---- 7. Cài đặt ---- */
{
  const base = blank();
  const pc = clone(base);
  const phone = clone(base);
  phone.settings.dailyGoal = 50;                     // chỉ máy kia đổi
  const a = mergeData(base, pc, phone);
  check(a.data.settings.dailyGoal === 50, "chỉ máy kia đổi cài đặt: lấy theo máy kia");

  const pc2 = clone(base);
  pc2.settings.dailyGoal = 40;
  const b = mergeData(base, pc2, phone);
  check(b.data.settings.dailyGoal === 40, "đổi cả hai bên: máy đang bấm đồng bộ thắng");

  const pc3 = clone(base);
  pc3.settings.mirrorDir = "G:\\Drive\\Denken";
  const c = mergeData(base, pc3, phone);
  check(c.data.settings.mirrorDir === "G:\\Drive\\Denken",
    "thư mục nhân bản là đường dẫn riêng của máy này, không bị máy kia ghi đè");
}

/* ---- 8. Không mất ghi chú khi máy kia chưa có bài đó ---- */
{
  const base = blank();
  const pc = clone(base);
  pc.progress["x"] = {
    ...prog("correct", "2026-08-12T10:00:00Z"),
    notes: [{ id: "n1", text: "cách giải hay", createdAt: "2026-08-12T10:00:00Z", attachments: [] }],
    links: [{ id: "l1", url: "https://gemini.example/x", label: "Gemini" }],
  };
  const phone = clone(base);

  const { data } = mergeData(base, pc, phone);
  check(data.progress["x"]?.notes[0]?.text === "cách giải hay", "ghi chú không bị mất khi gộp");
  check(data.progress["x"]?.links[0]?.url === "https://gemini.example/x", "link tham khảo không bị mất");
}

/* ---- 9. Gộp phải giao hoán: đổi vai hai máy vẫn ra cùng số liệu ---- */
{
  const base = blank();
  base.dailyLog["2026-08-12"] = { reviewed: 5, correct: 5, wrong: 0, bySubject: {} };
  base.progress["a"] = prog("todo", "2026-08-10T00:00:00Z");

  const pc = clone(base);
  pc.dailyLog["2026-08-12"].reviewed = 25;
  pc.progress["a"] = prog("correct", "2026-08-12T09:00:00Z");
  const phone = clone(base);
  phone.dailyLog["2026-08-12"].reviewed = 15;
  phone.progress["b"] = prog("wrong", "2026-08-12T08:00:00Z");

  const x = mergeData(base, pc, phone).data;
  const y = mergeData(base, phone, pc).data;
  check(x.dailyLog["2026-08-12"].reviewed === y.dailyLog["2026-08-12"].reviewed,
    `đổi vai hai máy ra cùng con số (${x.dailyLog["2026-08-12"].reviewed} = ${y.dailyLog["2026-08-12"].reviewed})`);
  check(Object.keys(x.progress).length === Object.keys(y.progress).length,
    "đổi vai hai máy ra cùng số bài");
}

/* ---- 10. Máy mới cài, chưa có gì: phải kéo về đủ, không xoá của máy kia ---- */
{
  const phone = blank();  // máy mới
  const pc = blank();
  for (let i = 0; i < 50; i += 1) pc.progress[`i${i}`] = prog("correct", "2026-08-01T00:00:00Z");
  pc.dailyLog["2026-08-01"] = { reviewed: 50, correct: 50, wrong: 0, bySubject: { riron: 50 } };
  pc.badges = { "first-step": "2026-08-01" };

  const { data } = mergeData(null, phone, pc);
  check(Object.keys(data.progress).length === 50, "máy mới kéo về đủ 50 bài");
  check(data.dailyLog["2026-08-01"].reviewed === 50, "máy mới kéo về đủ nhật ký ngày");
  check(Object.keys(data.badges).length === 1, "máy mới kéo về đủ huy hiệu");
}

/* ---- 11. Android: chặn đường dẫn vượt thư mục, y như bản Windows ---- */
{
  for (const bad of ["../data.json", "..\\data.json", "sub/x.png", "/etc/passwd", ".."]) {
    check(safeName(bad) === null, `chặn tên file nguy hiểm: ${JSON.stringify(bad)}`);
  }
  check(safeName("abc123.png") === "abc123.png", "tên file trơn thì cho qua");
}

/* ---- 12. Đọc file sao lưu người ta gửi sang ---- */
{
  const good = blank();
  good.progress["a"] = prog("correct", "2026-08-12T10:00:00Z");

  const parsed = parseBackup(JSON.stringify(good), blank());
  check("data" in parsed && !!parsed.data.progress["a"], "đọc được file sao lưu hợp lệ");

  check("error" in parseBackup("{ hỏng", blank()), "file không phải JSON thì báo lỗi, không ném");
  check("error" in parseBackup(JSON.stringify({ ten: "file khác" }), blank()),
    "file JSON nhưng không phải sổ ôn thi thì từ chối");
  check("error" in parseBackup("[1,2,3]", blank()), "mảng JSON cũng bị từ chối");

  // Dữ liệu bẩn không được làm hỏng cả file.
  const dirty = JSON.stringify({
    progress: { a: { status: "correct", srsLevel: "ba", history: "không phải mảng" } },
    dailyLog: { "2026-08-12": { reviewed: "nhiều" } },
  });
  const fixed = parseBackup(dirty, blank());
  check("data" in fixed && fixed.data.progress["a"].srsLevel === 0,
    "trường số hỏng thì về 0 chứ không thành NaN");
  check("data" in fixed && Array.isArray(fixed.data.progress["a"].history),
    "lịch sử hỏng thì về mảng rỗng");
  check("data" in fixed && fixed.data.dailyLog["2026-08-12"].reviewed === 0,
    "số bài ôn hỏng thì về 0");
}

/* ---- 13. Gộp qua file: xuất bên này, gộp bên kia, không mất gì ---- */
{
  const pc = blank();
  pc.progress["a"] = prog("correct", "2026-08-12T10:00:00Z");
  pc.dailyLog["2026-08-12"] = { reviewed: 5, correct: 5, wrong: 0, bySubject: { riron: 5 } };

  const phone = blank();
  phone.progress["b"] = prog("wrong", "2026-08-12T11:00:00Z");
  phone.dailyLog["2026-08-12"] = { reviewed: 3, correct: 1, wrong: 2, bySubject: { kikai: 3 } };

  // Đúng thao tác thật: xuất ra chuỗi JSON rồi bên kia đọc lại.
  const parsed = parseBackup(JSON.stringify(pc), blank());
  if (!("data" in parsed)) throw new Error("không đọc được file vừa xuất");
  const { data: merged } = mergeData(null, phone, parsed.data);

  check(!!merged.progress["a"] && !!merged.progress["b"], "gộp qua file giữ được bài của cả hai máy");
  check(merged.dailyLog["2026-08-12"].reviewed === 5,
    `không có mốc gốc thì lấy số lớn hơn, không cộng bừa (${merged.dailyLog["2026-08-12"].reviewed})`);

  // Bấm gộp hai lần liên tiếp không được đổi gì thêm.
  const { data: again } = mergeData(null, merged, parsed.data);
  const boUpdatedAt = (d: AppData) => JSON.stringify({ ...d, updatedAt: "" });
  check(boUpdatedAt(again) === boUpdatedAt(merged),
    "gộp lại lần nữa ra y nguyên, bấm nhầm hai lần không sao");
}

/* ================================================================== */
/* Đồng bộ tự động qua GitHub                                          */
/* ================================================================== */

/** Một GitHub giả: giữ đúng một file, có `sha`, từ chối ghi bằng `sha` cũ. */
function fakeGithub(khoiDau: string | null = null) {
  const kho = { text: khoiDau, sha: khoiDau ? "sha-1" : null as string | null };
  let dem = 1;
  const nhatKy: string[] = [];
  /** Chèn vào giữa lúc đọc xong và ghi — để dựng cảnh hai máy ghi cùng lúc. */
  let chen: (() => void) | null = null;

  const reply = (status: number, body: unknown) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });

  const doFetch: FetchLike = async (url, init) => {
    const method = init?.method ?? "GET";
    nhatKy.push(`${method} ${url.replace("https://api.github.com", "")}`);

    if (url.endsWith("/contents/data.json")) {
      if (method === "GET") {
        if (kho.text === null) return reply(404, { message: "Not Found" });
        const out = reply(200, { content: toBase64(kho.text), sha: kho.sha });
        if (chen) { chen(); chen = null; }
        return out;
      }
      const body = JSON.parse(init?.body ?? "{}") as { content: string; sha?: string };
      if ((body.sha ?? null) !== kho.sha) {
        return reply(409, { message: "does not match" });
      }
      kho.text = fromBase64(body.content);
      dem += 1;
      kho.sha = `sha-${dem}`;
      return reply(200, { content: { sha: kho.sha } });
    }

    // GET /repos/{chu}/{ten}
    return reply(200, { private: true, permissions: { push: true } });
  };

  return {
    doFetch,
    nhatKy,
    get noiDung() { return kho.text; },
    datChen(f: () => void) { chen = f; },
    /** Máy kia ghi thẳng vào kho, không qua app này. */
    mayKiaGhi(text: string) { kho.text = text; dem += 1; kho.sha = `sha-${dem}`; },
  };
}

function cauHinh(): SyncConfig {
  return { enabled: true, repo: "ai-do/du-lieu", token: "gh-token", file: "data.json", lastSyncAt: "" };
}

/** Kho phụ trong bộ nhớ, thay cho platform.sideRead/sideWrite. */
function khoPhu() {
  let text: string | null = null;
  return {
    readBase: async () => text,
    writeBase: async (t: string) => { text = t; },
    get base() { return text; },
  };
}

/** Các ca cần `await`; esbuild xuất CJS nên không await được ở cấp cao nhất. */
async function kiemThuDongBo(): Promise<void> {
  /* ---- 16. Tên repo và base64 ---- */
  {
    for (const tot of ["heynyren/du-lieu", "a/b", "Ten_Co-Dau.1/repo.2"]) {
      check(validRepo(tot), `nhận repo hợp lệ: ${tot}`);
    }
    for (const xau of ["heynyren", "a/b/c", "../../etc", "a b/c", "", "/x"]) {
      check(!validRepo(xau), `chặn repo sai dạng: ${JSON.stringify(xau)}`);
    }

    const chu = 'Bài tập tính toán — コンデンサ, 90% "khó"\n\tdòng hai';
    check(fromBase64(toBase64(chu)) === chu, "base64 giữ nguyên cả tiếng Việt lẫn tiếng Nhật");

    for (const xau of ["../sync-config.json", "a/b.json", "SYNC.json", "x.txt", "..", ""]) {
      check(sideName(xau) === null, `kho phụ chặn tên file: ${JSON.stringify(xau)}`);
    }
    check(sideName("sync-base.json") === "sync-base.json", "kho phụ cho qua tên đúng dạng");
  }

  /* ---- 17. Lần đầu: repo trống thì đẩy nguyên bản máy này lên ---- */
  {
    const pc = blank();
    pc.progress["a"] = prog("correct", "2026-08-12T10:00:00Z");
    const gh = fakeGithub(null);
    const kho = khoPhu();

    const outcome = await syncOnce({ config: cauHinh(), local: pc, ...kho, doFetch: gh.doFetch });
    check(outcome.pushed, "repo trống thì đẩy lên");
    check(!outcome.changed, "máy này không phải đổi gì");
    check(gh.noiDung !== null && JSON.parse(gh.noiDung).progress["a"] !== undefined,
      "bài của máy này đã nằm trên GitHub");
    check(kho.base !== null, "có ghi bản chụp cho lần gộp sau");
  }

  /* ---- 18. Máy thứ hai: kéo về đủ, không đẩy lên vô ích ---- */
  {
    const pc = blank();
    pc.progress["a"] = prog("correct", "2026-08-12T10:00:00Z");
    const gh = fakeGithub(JSON.stringify(pc));

    const dienThoai = blank();  // máy mới cài
    const kho = khoPhu();
    const outcome = await syncOnce({ config: cauHinh(), local: dienThoai, ...kho, doFetch: gh.doFetch });

    check(outcome.changed, "máy mới nhận được dữ liệu");
    check(!outcome.pushed, "không có gì mới thì không ghi lên GitHub");
    check(!!outcome.data.progress["a"], "kéo về đủ bài");
    check(!gh.nhatKy.some((d) => d.startsWith("PUT")), "không gọi PUT lần nào");
  }

  /* ---- 19. Hai bên đều có phần mới: gộp rồi đẩy, không bên nào mất ---- */
  {
    const tren = blank();
    tren.progress["a"] = prog("correct", "2026-08-12T10:00:00Z");
    const gh = fakeGithub(JSON.stringify(tren));

    const may = blank();
    may.progress["b"] = prog("wrong", "2026-08-12T11:00:00Z");
    const kho = khoPhu();

    const outcome = await syncOnce({ config: cauHinh(), local: may, ...kho, doFetch: gh.doFetch });
    check(outcome.pushed && outcome.changed, "vừa kéo về vừa đẩy lên");
    const cuoi = JSON.parse(gh.noiDung!) as AppData;
    check(!!cuoi.progress["a"] && !!cuoi.progress["b"], "bản trên GitHub có bài của cả hai máy");
    check(!!outcome.data.progress["a"] && !!outcome.data.progress["b"], "máy này cũng có đủ hai bài");
  }

  /* ---- 20. Hai bên y hệt: không ghi gì cả ---- */
  {
    const cung = blank();
    cung.progress["a"] = prog("correct", "2026-08-12T10:00:00Z");
    const gh = fakeGithub(JSON.stringify(cung));
    const kho = khoPhu();

    const outcome = await syncOnce({ config: cauHinh(), local: cung, ...kho, doFetch: gh.doFetch });
    check(!outcome.pushed && !outcome.changed, "giống nhau thì không đụng gì");
    check(outcome.note.includes("giống nhau"), "báo đúng là hai bên đã giống nhau");
  }

  /* ---- 21. Máy kia ghi chen vào giữa: đọc lại, gộp lại, không mất dữ liệu ---- */
  {
    const tren = blank();
    tren.progress["a"] = prog("correct", "2026-08-12T10:00:00Z");
    const gh = fakeGithub(JSON.stringify(tren));

    const may = blank();
    may.progress["b"] = prog("wrong", "2026-08-12T11:00:00Z");
    const kho = khoPhu();

    // Ngay sau khi ta đọc xong, máy thứ ba ghi thêm bài "c" vào.
    gh.datChen(() => {
      const chen = blank();
      chen.progress["a"] = prog("correct", "2026-08-12T10:00:00Z");
      chen.progress["c"] = prog("correct", "2026-08-12T12:00:00Z");
      gh.mayKiaGhi(JSON.stringify(chen));
    });

    const outcome = await syncOnce({ config: cauHinh(), local: may, ...kho, doFetch: gh.doFetch });
    const cuoi = JSON.parse(gh.noiDung!) as AppData;
    check(outcome.pushed, "thử lại rồi ghi được");
    check(!!cuoi.progress["a"] && !!cuoi.progress["b"] && !!cuoi.progress["c"],
      "bị ghi chen vẫn giữ đủ cả ba bài, không đè mất bài của máy kia");
    check(gh.nhatKy.filter((d) => d.startsWith("PUT")).length === 2,
      "lần PUT đầu bị từ chối, lần sau mới ăn");
  }

  /* ---- 22. File trên mạng hỏng: dừng lại, tuyệt đối không ghi đè ---- */
  {
    const gh = fakeGithub("{ đây không phải JSON");
    const may = blank();
    may.progress["b"] = prog("wrong", "2026-08-12T11:00:00Z");
    const kho = khoPhu();

    let nem = "";
    try {
      await syncOnce({ config: cauHinh(), local: may, ...kho, doFetch: gh.doFetch });
    } catch (cause) {
      nem = (cause as Error).message;
    }
    check(nem.includes("không đọc được"), "báo rõ là file trên GitHub hỏng");
    check(gh.noiDung === "{ đây không phải JSON", "KHÔNG ghi đè lên file hỏng");
  }

  /* ---- 23. Token sai: báo bằng tiếng Việt, không ném lỗi kỹ thuật ---- */
  {
    const doFetch: FetchLike = async () => ({
      ok: false, status: 401,
      json: async () => ({ message: "Bad credentials" }),
      text: async () => "",
    });
    let nem = "";
    try {
      await syncOnce({ config: cauHinh(), local: blank(), ...khoPhu(), doFetch });
    } catch (cause) {
      nem = (cause as Error).message;
    }
    check(nem.includes("Token sai"), `token sai báo dễ hiểu: "${nem}"`);
  }

  /* ---- 24. Bật đồng bộ ở ĐIỆN THOẠI TRƯỚC, máy tính mới là bản đúng ----
     Đây là tình huống thật: điện thoại vừa cài, bấm bật đồng bộ, đẩy một sổ
     gần như trắng lên GitHub. Sau đó mới tới lượt máy tính — nơi có toàn bộ
     dữ liệu thật. Máy tính KHÔNG được mất gì. */
  {
    // Điện thoại vừa cài, lỡ chấm 2 bài rồi bật đồng bộ.
    const dienThoai = blank();
    dienThoai.settings.dailyGoal = 30;          // để nguyên mặc định
    dienThoai.settings.examDate = "2027-03-21";
    dienThoai.progress["dt-1"] = prog("correct", "2026-08-13T08:00:00Z");
    dienThoai.progress["dt-2"] = prog("wrong", "2026-08-13T08:05:00Z");
    dienThoai.dailyLog["2026-08-13"] = { reviewed: 2, correct: 1, wrong: 1, bySubject: { riron: 2 } };

    const gh = fakeGithub(null);
    const khoDT = khoPhu();
    await syncOnce({ config: cauHinh(), local: dienThoai, ...khoDT, doFetch: gh.doFetch });
    check(gh.noiDung !== null, "điện thoại bật trước: đã đẩy sổ của nó lên");

    // Máy tính: dữ liệu thật, nhiều tháng ôn tập.
    const may = blank();
    may.settings.dailyGoal = 50;                 // người dùng đã tự chỉnh
    may.settings.examDate = "2026-09-01";
    for (let i = 0; i < 500; i += 1) {
      may.progress[`bai-${i}`] = prog("correct", "2026-07-01T10:00:00Z", 3);
    }
    may.progress["bai-0"].notes = [
      { id: "n1", text: "ghi chú quan trọng", createdAt: "2026-07-01T10:00:00Z", attachments: [] },
    ];
    may.dailyLog["2026-07-01"] = { reviewed: 40, correct: 38, wrong: 2, bySubject: { riron: 40 } };
    may.dailyLog["2026-08-13"] = { reviewed: 12, correct: 10, wrong: 2, bySubject: { kikai: 12 } };
    may.badges = { "first-step": "2026-07-01", "streak-7": "2026-07-08" };
    may.examResults = [{
      id: "thi-1", exam: "R07下", takenAt: "2026-08-01T09:00:00Z",
      scores: [{ subject: "riron", score: 72, correct: 13, total: 18, passed: true }],
    }];

    const khoMay = khoPhu();
    const kq = await syncOnce({ config: cauHinh(), local: may, ...khoMay, doFetch: gh.doFetch });

    // Máy tính giữ nguyên mọi thứ của nó.
    check(Object.keys(kq.data.progress).length === 502,
      `máy tính giữ đủ 500 bài + nhận 2 bài của điện thoại (${Object.keys(kq.data.progress).length})`);
    check(kq.data.progress["bai-0"].notes.length === 1, "ghi chú của máy tính còn nguyên");
    check(kq.data.progress["bai-499"].srsLevel === 3, "cấp độ ôn của máy tính còn nguyên");
    check(kq.data.settings.dailyGoal === 50 && kq.data.settings.examDate === "2026-09-01",
      "cài đặt của máy tính THẮNG, không bị mặc định của điện thoại đè");
    check(Object.keys(kq.data.badges).length === 2, "huy hiệu của máy tính còn nguyên");
    check(kq.data.examResults.length === 1, "lượt thi thử của máy tính còn nguyên");
    check(kq.data.dailyLog["2026-07-01"].reviewed === 40, "nhật ký ngày cũ của máy tính còn nguyên");
    // Cùng một ngày hai bên đều có: chưa có mốc gốc nên lấy bên lớn hơn.
    check(kq.data.dailyLog["2026-08-13"].reviewed === 12,
      `ngày trùng lấy số lớn hơn, không cộng bừa (${kq.data.dailyLog["2026-08-13"].reviewed})`);
    // Và bài của điện thoại cũng không mất.
    check(!!kq.data.progress["dt-1"] && !!kq.data.progress["dt-2"],
      "hai bài làm trên điện thoại vẫn còn");
    check(kq.pushed, "máy tính đẩy bản gộp lên");

    // Điện thoại đồng bộ lại: phải nhận đủ về.
    const kq2 = await syncOnce({ config: cauHinh(), local: dienThoai, ...khoDT, doFetch: gh.doFetch });
    check(Object.keys(kq2.data.progress).length === 502, "điện thoại kéo về đủ 502 bài");
    check(kq2.data.settings.dailyGoal === 50,
      "điện thoại nhận luôn cài đặt của máy tính, hai bên hết lệch");
    check(!kq2.pushed, "điện thoại không phải ghi lại lần nữa");

    // Và phải DỪNG. Nếu hai bên còn bất đồng về cài đặt thì cứ 5 phút lại ghi
    // đè lẫn nhau một lần, mãi không thôi — đúng kiểu lỗi không ai để ý.
    const kq3 = await syncOnce({ config: cauHinh(), local: kq.data, ...khoMay, doFetch: gh.doFetch });
    check(!kq3.pushed && !kq3.changed, "máy tính đồng bộ tiếp: đứng yên, không ghi qua ghi lại");
    const kq4 = await syncOnce({ config: cauHinh(), local: kq2.data, ...khoDT, doFetch: gh.doFetch });
    check(!kq4.pushed && !kq4.changed, "điện thoại đồng bộ tiếp: cũng đứng yên");
  }
}

/* ---- 14. Chuông báo hết giờ ---- */
{
  // Dựng đủ thứ trình duyệt mà alarm.ts cần, rồi mới nạp module.
  const rung: unknown[] = [];
  let daoTao = 0;
  let daDong = 0;
  class FakeContext {
    state = "suspended";
    currentTime = 0;
    constructor() { daoTao += 1; }
    resume() { this.state = "running"; return Promise.resolve(); }
    close() { daDong += 1; this.state = "closed"; return Promise.resolve(); }
    createOscillator() {
      return {
        type: "", frequency: { value: 0 },
        connect: (n: unknown) => n, start() {}, stop() {},
      };
    }
    createGain() {
      return {
        gain: { setValueAtTime() {}, linearRampToValueAtTime() {} },
        connect: (n: unknown) => n,
      };
    }
  }
  const g = globalThis as Record<string, unknown>;
  g.window = { AudioContext: FakeContext };
  // `navigator` của Node chỉ có getter, gán thẳng là ném lỗi.
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { vibrate: (p: unknown) => { rung.push(p); return true; } },
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createAlarm, primeAudio, audioReady } = require("../src/lib/alarm") as typeof import("../src/lib/alarm");

  check(!audioReady(), "chưa chạm gì thì chưa có quyền phát tiếng");

  // Đây là chỗ bản cũ hỏng trên Android: context phải được mở khoá TỪ TRƯỚC,
  // lúc người dùng còn đang chạm màn hình, chứ không phải lúc chuông reo.
  primeAudio();
  check(daoTao === 1, "chạm lần đầu tạo đúng một AudioContext");
  check(audioReady(), "chạm xong là sẵn sàng phát tiếng");

  primeAudio();
  primeAudio();
  check(daoTao === 1, "chạm thêm mấy lần nữa cũng không đẻ thêm context");

  const alarm = createAlarm();
  alarm.start();
  check(alarm.ringing, "gọi start thì chuông reo");
  check(rung.length > 0, "có rung, để máy im lặng vẫn báo được");

  alarm.stop();
  check(!alarm.ringing, "gọi stop thì chuông tắt");
  check(daDong === 0, "stop KHÔNG đóng context — đóng là mất quyền phát tiếng lần sau");

  // Lần thứ hai phải kêu được, không cần chạm lại.
  const truoc = rung.length;
  alarm.start();
  check(rung.length > truoc, "reo lần thứ hai vẫn kêu, không cần chạm lại màn hình");
  check(daoTao === 1, "reo lần hai dùng lại context cũ");
  alarm.stop();
}


/* ---- 15. Lời nhắc hết giờ trên Windows ---- */
{
  const hienRa: string[] = [];
  const g = globalThis as Record<string, unknown>;
  g.Notification = function (this: unknown, title: string, opts: { body?: string }) {
    hienRa.push(`${title} | ${opts?.body ?? ""}`);
  };

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { desktop } = require("../src/platform/desktop") as typeof import("../src/platform/desktop");

  void (async () => {
    await kiemThuDongBo();

    const qua = await desktop.notifyAt(1, Date.now() - 1000, "cũ", "rồi");
    check(!qua.ok, "hẹn vào mốc đã qua thì từ chối, không nhắc ngay lập tức");

    await desktop.notifyAt(1, Date.now() + 40, "⏰ Hết giờ làm bài", "Chốt đáp án nhé.");
    await desktop.notifyAt(2, Date.now() + 40, "không nên hiện", "");
    await desktop.cancelNotify(2);

    await new Promise((r) => setTimeout(r, 120));
    check(hienRa.length === 1, `đúng giờ thì hiện một lời nhắc (${hienRa.length})`);
    check(hienRa[0]?.startsWith("⏰ Hết giờ làm bài"), "nội dung lời nhắc đúng");
    check(!hienRa.some((t) => t.includes("không nên hiện")),
      "huỷ rồi thì không nhắc nữa — nộp bài sớm không bị chuông đuổi theo");

    // Hẹn lại cùng một mã thì lần trước phải bị thay, không nhắc hai lần.
    hienRa.length = 0;
    await desktop.notifyAt(1, Date.now() + 500, "lần cũ", "");
    await desktop.notifyAt(1, Date.now() + 40, "lần mới", "");
    await new Promise((r) => setTimeout(r, 700));
    check(hienRa.length === 1 && hienRa[0].startsWith("lần mới"),
      "hẹn lại cùng mã thì thay lần cũ, không kêu hai lần");

    console.log(`\n${pass} đạt · ${fail} hỏng`);
    process.exit(fail === 0 ? 0 : 1);
  })();
}
