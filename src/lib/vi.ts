/**
 * Tiếng Việt cho danh mục: tên chủ đề, và tìm kiếm bằng tiếng Việt.
 *
 * Bài toán: 1609 bài đều mang tên tiếng Nhật. Muốn gõ "tụ điện" mà ra được
 * コンデンサ thì có hai đường:
 *
 *   a) Dịch cả 1427 tên bài sang tiếng Việt rồi tìm trên bản dịch.
 *   b) Dịch **câu hỏi** thay vì dịch **kho**: gặp từ tiếng Việt thì tra ra từ
 *      tiếng Nhật tương ứng rồi tìm bằng từ đó.
 *
 * Chọn (b): khoảng 200 mục từ điển phủ được cả 1609 bài, trong khi (a) cần 1427
 * bản dịch mới tìm được đúng chừng ấy bài. Hai đường không loại trừ nhau — tên
 * bài tiếng Việt vẫn có thể bổ sung dần, xem `titles-vi.json`.
 *
 * Gõ không dấu vẫn ra: "dien tro" tìm được 抵抗, vì cả câu hỏi lẫn phần tiếng
 * Việt của kho đều được bỏ dấu trước khi so.
 */

/** Bỏ dấu tiếng Việt và hạ chữ thường: "Điện trở" -> "dien tro". */
export function noAccent(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

/**
 * Tên chủ đề bằng tiếng Việt. Đủ cả 47 chủ đề của bốn môn.
 *
 * Đây là phần tiếng Việt phủ được **mọi** bài trong danh mục: bài nào cũng
 * thuộc một chủ đề, nên bài nào cũng có một dòng tiếng Việt để đọc và để tìm.
 */
export const TOPIC_VI: Record<string, string> = {
  // 理論
  "電磁気（静電界）": "Điện từ — Tĩnh điện",
  "電磁気（磁気、電磁力）": "Điện từ — Từ trường, lực điện từ",
  "電気回路（直流回路）": "Mạch điện — Mạch một chiều",
  "電気回路（単相交流）": "Mạch điện — Xoay chiều một pha",
  "電気回路（三相交流）": "Mạch điện — Xoay chiều ba pha",
  "電気回路（過渡現象）": "Mạch điện — Quá trình quá độ",
  "電子理論（半導体）": "Điện tử — Chất bán dẫn",
  "電子理論（電子の運動）": "Điện tử — Chuyển động của electron",
  "電子理論（電子回路）": "Điện tử — Mạch điện tử",
  "電気及び電子計測": "Đo lường điện và điện tử",

  // 電力
  電力水力: "Thuỷ điện",
  火力: "Nhiệt điện",
  原子力: "Điện hạt nhân",
  新エネルギー発電: "Năng lượng mới",
  変電: "Trạm biến áp",
  送電: "Truyền tải điện",
  "送電（地中送電知識）": "Truyền tải — Cáp ngầm",
  "送電（計算）": "Truyền tải — Bài tính",
  "配電（知識）": "Phân phối điện — Lý thuyết",
  "配電（計算）": "Phân phối điện — Bài tính",
  電気材料: "Vật liệu điện",

  // 機械
  直流機: "Máy điện một chiều",
  誘導機: "Máy điện không đồng bộ",
  同期機: "Máy điện đồng bộ",
  変圧器: "Máy biến áp",
  四機総合問題: "Tổng hợp bốn loại máy điện",
  パワーエレクトロニクス: "Điện tử công suất",
  電動機応用: "Ứng dụng động cơ điện",
  電熱: "Nhiệt điện trở — Gia nhiệt",
  電気化学: "Điện hoá",
  照明: "Chiếu sáng",
  自動制御: "Điều khiển tự động",
  情報伝送及び処理: "Truyền và xử lý thông tin",
  メカトロニクス: "Cơ điện tử",
  電気機器: "Thiết bị điện",

  // 法規
  電気事業法及び施行規則: "Luật Điện lực và quy tắc thi hành",
  電気工事士法: "Luật Thợ điện",
  電気工事業法: "Luật Doanh nghiệp thi công điện",
  電気用品安全法: "Luật An toàn thiết bị điện",
  電気関係報告規則: "Quy tắc báo cáo về điện",
  電気設備の技術基準を定める省令: "Nghị định về tiêu chuẩn kỹ thuật thiết bị điện",
  電気設備技術基準の解釈: "Giải thích tiêu chuẩn kỹ thuật thiết bị điện",
  "電気設備技術基準（計算）": "Tiêu chuẩn kỹ thuật thiết bị điện — Bài tính",
  風力設備技術基準: "Tiêu chuẩn kỹ thuật thiết bị điện gió",
  "電気施設管理（知識）": "Quản lý công trình điện — Lý thuyết",
  "電気施設管理（計算）": "Quản lý công trình điện — Bài tính",
  "（chưa phân loại）": "Chưa phân loại",
};

export function topicVi(topic: string): string {
  return TOPIC_VI[topic] ?? "";
}

/**
 * Từ điển tra ngược: gõ tiếng Việt -> tìm bằng từ tiếng Nhật.
 *
 * Khoá viết **không dấu, chữ thường** để gõ kiểu nào cũng khớp. Giá trị là các
 * từ tiếng Nhật sẽ được đem đi tìm trong tên bài.
 *
 * Danh sách này dựng từ chính tần suất trong 1609 tên bài chứ không phải đoán:
 * コンデンサ 61 lần, 変圧器 47, 抵抗 40, 電流 38… nên phủ được phần lớn nội dung
 * thật sự có trong danh mục.
 */
export const GLOSSARY: Record<string, string[]> = {
  // --- Linh kiện, đại lượng cơ bản ---
  "tu dien": ["コンデンサ", "静電容量"],
  tu: ["コンデンサ"],
  "dien dung": ["静電容量"],
  "dien tro": ["抵抗"],
  "dien tro suat": ["抵抗率"],
  "cuon day": ["コイル", "巻線"],
  "cuon cam": ["コイル", "インダクタンス"],
  "dien cam": ["インダクタンス"],
  "tu cam": ["自己インダクタンス"],
  "ho cam": ["相互インダクタンス"],
  "dien ap": ["電圧"],
  "hieu dien the": ["電圧"],
  "dong dien": ["電流"],
  "cong suat": ["電力", "出力"],
  "dien nang": ["電力量", "エネルギー"],
  "nang luong": ["エネルギー"],
  "dien tich": ["電荷"],
  "dien truong": ["電界"],
  "tu truong": ["磁界", "磁束"],
  "tu thong": ["磁束"],
  "luc dien tu": ["電磁力"],
  "tro khang": ["インピーダンス"],
  "cam khang": ["リアクタンス"],
  "he so cong suat": ["力率"],
  "cong huong": ["共振"],
  "tan so": ["周波数"],
  "goc pha": ["位相"],
  pha: ["位相", "相"],
  "mot pha": ["単相"],
  "ba pha": ["三相"],
  "mot chieu": ["直流"],
  "xoay chieu": ["交流"],
  "noi tiep": ["直列"],
  "song song": ["並列"],
  "mach dien": ["回路"],
  "mach cau": ["ブリッジ"],
  "qua do": ["過渡現象"],
  "hang so thoi gian": ["時定数"],

  // --- Máy điện ---
  "may bien ap": ["変圧器"],
  "bien ap": ["変圧器"],
  "dong co": ["電動機"],
  "dong co dien": ["電動機"],
  "dong co khong dong bo": ["誘導電動機"],
  "dong co cam ung": ["誘導電動機"],
  "may phat": ["発電機"],
  "may phat dien": ["発電機"],
  "dong bo": ["同期"],
  "khong dong bo": ["誘導"],
  "may dien mot chieu": ["直流機"],
  "roto": ["回転子"],
  "stato": ["固定子"],
  "momen": ["トルク"],
  "mo men": ["トルク"],
  "toc do quay": ["回転速度"],
  "he so truot": ["すべり"],
  truot: ["すべり"],
  "hieu suat": ["効率"],
  "ton hao": ["損失"],
  "ton hao sat": ["鉄損"],
  "ton hao dong": ["銅損"],
  "khoi dong": ["始動"],
  "dieu chinh toc do": ["速度制御"],

  // --- Điện tử ---
  "ban dan": ["半導体"],
  diot: ["ダイオード"],
  "dai ot": ["ダイオード"],
  tranzito: ["トランジスタ"],
  "tran zi to": ["トランジスタ"],
  "khuech dai": ["増幅"],
  "mach khuech dai": ["増幅回路"],
  "khuech dai thuat toan": ["演算増幅器"],
  "op amp": ["演算増幅器"],
  "mach logic": ["論理回路"],
  logic: ["論理"],
  "bang chan ly": ["真理値表"],
  "flip flop": ["フリップフロップ"],
  electron: ["電子"],
  "chinh luu": ["整流"],
  "nghich luu": ["インバータ"],
  inverter: ["インバータ"],
  chopper: ["チョッパ"],
  thyristor: ["サイリスタ"],
  igbt: ["IGBT"],

  // --- Nhà máy điện, lưới điện ---
  "thuy dien": ["水力発電"],
  "tua bin": ["タービン", "水車"],
  "nhiet dien": ["汽力発電", "火力"],
  "lo hoi": ["ボイラ"],
  "hat nhan": ["原子力", "原子炉"],
  "lo phan ung": ["原子炉"],
  "dien gio": ["風力発電"],
  "dien mat troi": ["太陽光発電"],
  "sinh khoi": ["バイオマス"],
  "dia nhiet": ["地熱"],
  "pin nhien lieu": ["燃料電池"],
  "truyen tai": ["送電"],
  "phan phoi": ["配電"],
  "tram bien ap": ["変電所"],
  "duong day": ["線路", "電線"],
  "day dan": ["電線", "導体"],
  cap: ["ケーブル"],
  "cap ngam": ["地中", "ケーブル"],
  "su cach dien": ["がいし"],
  "cach dien": ["絶縁"],
  "noi dat": ["接地"],
  "tiep dia": ["接地"],
  "ngan mach": ["短絡"],
  "cham dat": ["地絡"],
  "sut ap": ["電圧降下"],
  "do vong": ["たるみ", "弛度"],
  "may cat": ["遮断器"],
  "chong set": ["避雷"],
  set: ["雷"],
  "vang quang": ["コロナ"],
  "bu cong suat": ["調相", "力率改善"],

  // --- Ứng dụng, đo lường, pháp quy ---
  "chieu sang": ["照明"],
  "do roi": ["照度"],
  "quang thong": ["光束"],
  "dien hoa": ["電気化学"],
  "ac quy": ["蓄電池"],
  pin: ["電池"],
  "ma dien": ["めっき"],
  "gia nhiet": ["電熱", "加熱"],
  "bom nhiet": ["ヒートポンプ"],
  "dieu khien": ["制御"],
  "dieu khien tu dong": ["自動制御"],
  "ham truyen": ["伝達関数"],
  "so do khoi": ["ブロック線図"],
  "do luong": ["計測"],
  "dong ho do": ["計器"],
  "sai so": ["誤差"],
  "luat dien luc": ["電気事業法"],
  luat: ["法"],
  "tieu chuan ky thuat": ["技術基準"],
  "an toan": ["安全", "保安"],
  "bao cao su co": ["事故報告"],
  "quan ly": ["管理"],
  "kiem tra": ["点検", "試験"],
  "thu nghiem": ["試験"],
  "do ben cach dien": ["絶縁耐力"],

  // --- Loại câu hỏi ---
  "bai tinh": ["計算問題"],
  "tinh toan": ["計算"],
  "dien vao cho trong": ["空欄穴埋問題"],
  "trac nghiem": ["選択問題"],
  "ly thuyet": ["論説問題"],
  "ly luan": ["論説問題"],
};

/**
 * Tra câu hỏi tiếng Việt ra các từ tiếng Nhật cần tìm.
 *
 * Khớp theo cụm dài trước: "tu dien" phải ra コンデンサ chứ không phải ra kết
 * quả của "tu" rồi ghép bừa với "dien".
 */
export function expandQuery(query: string): string[] {
  const needle = noAccent(query).replace(/\s+/g, " ").trim();
  if (!needle) return [];

  const keys = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
  const out = new Set<string>();
  for (const key of keys) {
    if (needle.includes(key)) {
      for (const term of GLOSSARY[key] ?? []) out.add(term);
    }
  }
  return [...out];
}

/* ------------------------------------------------------------------ */
/* Tìm kiếm                                                            */
/* ------------------------------------------------------------------ */

/** Kho chữ của một bài để đem đi tìm — cả tiếng Nhật lẫn tiếng Việt. */
export function haystackOf(
  item: {
    name: string;
    nameVi?: string;
    topic: string;
    category: string;
    exam: string;
    question: string;
  },
  notes: string,
  links: string,
): string {
  return [
    item.name,
    item.nameVi ?? "",
    item.topic,
    topicVi(item.topic),
    item.category,
    item.exam,
    item.question,
    notes,
    links,
  ].join(" ");
}

/**
 * Bài này có khớp câu tìm kiếm không.
 *
 * Khớp khi **một trong ba** đúng:
 *   1. Gõ thẳng vào kho — dùng cho tiếng Nhật, mã kỳ thi, hay chữ trong ghi chú.
 *   2. Gõ bỏ dấu khớp kho bỏ dấu — "dien tro" khớp "Điện trở" trong tên chủ đề
 *      tiếng Việt và trong ghi chú của chính người dùng.
 *   3. Tra từ điển ra từ tiếng Nhật rồi tìm bằng từ đó — "tụ điện" ra コンデンサ.
 */
export function matchesQuery(haystack: string, query: string): boolean {
  const needle = query.trim();
  if (!needle) return true;

  if (haystack.toLowerCase().includes(needle.toLowerCase())) return true;
  if (noAccent(haystack).includes(noAccent(needle))) return true;

  const terms = expandQuery(needle);
  return terms.some((term) => haystack.includes(term));
}
