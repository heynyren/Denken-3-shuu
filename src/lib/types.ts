/**
 * Kiểu dữ liệu dùng chung giữa tiến trình chính (electron/) và giao diện (src/).
 *
 * Ranh giới quan trọng nhất của cả app:
 *
 *   CatalogItem  = CODE.  Đi kèm bản cài đặt, cập nhật app là cập nhật nó.
 *                         Chứa link bài tập denken-ou.com — ai cài cũng giống nhau.
 *
 *   ItemProgress = DATA.  Nằm ở thư mục dữ liệu riêng, update app không đụng tới.
 *                         Chứa link tham khảo, ghi chú, trạng thái — của riêng bạn.
 *
 * Hai bên nối nhau bằng `CatalogItem.id`.
 */

export type SubjectKey = "riron" | "denryoku" | "kikai" | "houki";

export interface Subject {
  key: SubjectKey;
  name: string;
  viName: string;
  sheet: string;
}

/** Một bài tập trong danh mục. Bất biến với người dùng. */
export interface CatalogItem {
  id: string;
  subject: SubjectKey;
  topic: string;
  no: number;
  /** Tên bài tiếng Nhật, y như trên denken-ou.com. */
  name: string;
  /**
   * Bản dịch tiếng Việt của tên bài, do người dùng tự viết trong file Excel gốc.
   * Rỗng với bài chưa được dịch.
   */
  nameVi: string;
  stars: number;
  category: string;
  exam: string;
  question: string;
  url: string;
}

export interface Catalog {
  version: number;
  generatedAt: string;
  source: string;
  srsIntervals: number[];
  subjects: Subject[];
  items: CatalogItem[];
}

export type ItemStatus = "todo" | "correct" | "relearned" | "wrong";

export interface ReviewEvent {
  /** Ngày ôn, dạng YYYY-MM-DD theo giờ máy. */
  date: string;
  result: "correct" | "wrong";
  /** Cấp độ ôn SAU khi ghi nhận kết quả. */
  level: number;
}

export type AttachmentKind = "image" | "pdf" | "docx" | "other";

/**
 * File đính kèm một ghi chú.
 *
 * Chỉ phần mô tả nằm trong data.json; nội dung file nằm riêng ở thư mục
 * `attachments/`. Nhồi cả file vào JSON sẽ khiến mỗi lần gõ một chữ trong ghi
 * chú là phải ghi lại vài chục MB xuống đĩa.
 */
export interface Attachment {
  id: string;
  /** Tên gốc, hiện cho người dùng thấy. */
  name: string;
  /** Tên file trong thư mục attachments/ — luôn là tên trơn, không có đường dẫn. */
  file: string;
  kind: AttachmentKind;
  size: number;
  addedAt: string;
}

/** Một ghi chú. Mỗi bài có thể có nhiều ghi chú, mỗi ghi chú kèm nhiều file. */
export interface NoteEntry {
  id: string;
  text: string;
  createdAt: string;
  attachments: Attachment[];
}

/** Một link tham khảo riêng của người dùng (Gemini, YouTube, blog…). */
export interface LinkEntry {
  id: string;
  url: string;
  /** Tên tự đặt cho dễ nhớ; để trống thì hiện chính đường link. */
  label: string;
}

/** Tiến độ của một bài. Đây là dữ liệu của người dùng. */
export interface ItemProgress {
  status: ItemStatus;
  notes: NoteEntry[];
  links: LinkEntry[];
  /**
   * Lần cuối bản ghi này thay đổi.
   *
   * Chưa dùng tới trong bản chạy trên máy tính, nhưng phải ghi từ bây giờ:
   * đồng bộ với app Android sau này gộp theo từng bài dựa trên mốc này, mà dữ
   * liệu ghi ra hôm nay thiếu mốc thì sau không gộp được nữa.
   * Xem docs/SAO-LUU-VA-DONG-BO.md.
   */
  updatedAt: string;
  doneDate: string | null;
  /** 0 = chưa vào chu kỳ ôn; 1..6 ứng với 1/3/7/14/30/90 ngày. */
  srsLevel: number;
  nextReview: string | null;
  history: ReviewEvent[];
}

/** Thống kê của một ngày, dùng cho streak, biểu đồ và lịch nhiệt. */
export interface DayLog {
  reviewed: number;
  correct: number;
  wrong: number;
  bySubject: Partial<Record<SubjectKey, number>>;
}

export interface Settings {
  dailyGoal: number;
  /**
   * Thư mục nhân bản dữ liệu, thường trỏ vào thư mục Google Drive/OneDrive.
   * Rỗng = tắt. Đây là thứ cứu bạn khi ổ cứng hỏng.
   */
  mirrorDir: string;
  /** Ngày thi, dạng YYYY-MM-DD. Người dùng tự chỉnh trong Cài đặt. */
  examDate: string;
  /** Số ngày tối đa giữ bản sao lưu tự động. */
  backupsToKeep: number;
}

/**
 * Bài làm của một câu trong một lần thi: chọn gì, đáp án đúng là gì.
 *
 * Lưu cả `truth` chứ không tra lại bảng đáp án lúc xem: bảng đáp án còn được bổ
 * sung dần, tra lại sau này sẽ ra bảng phân tích không khớp với điểm đã lưu.
 * Mỗi mảng một phần tử cho A問題, hai phần tử cho B問題 — ý (a) và ý (b).
 */
export interface ExamAnswerRecord {
  /** id bài trong danh mục, để tra ngược ra môn, chủ đề, tên bài và link. */
  id: string;
  /** Đáp án đã chọn từng ý; null = bỏ trống. */
  picked: (number | null)[];
  /** Đáp án đúng từng ý lúc chấm; thiếu phần tử = lúc đó chưa có đáp án. */
  truth: (number | null)[];
}

/** Điểm một môn trong một lần thi thử. */
export interface ExamSubjectScore {
  subject: SubjectKey;
  score: number;
  correct: number;
  total: number;
  passed: boolean;
  /**
   * Chi tiết từng câu, dùng cho bảng phân tích và thống kê chỗ yếu.
   * Lượt thi lưu từ bản cũ không có trường này — giao diện phải chịu được.
   */
  answers?: ExamAnswerRecord[];
}

/** Một lần thi thử đã lưu. */
export interface ExamResult {
  id: string;
  /** Kỳ thi, ví dụ "R07下". */
  exam: string;
  takenAt: string;
  scores: ExamSubjectScore[];
}

export interface AppData {
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  settings: Settings;
  progress: Record<string, ItemProgress>;
  dailyLog: Record<string, DayLog>;
  /** id huy hiệu -> ngày đạt được (YYYY-MM-DD). */
  badges: Record<string, string>;
  examResults: ExamResult[];
}

/** Kết quả sau một lần nhập từ Excel, để báo lại cho người dùng. */
export interface ImportReport {
  matched: number;
  unmatched: number;
  notes: number;
  refLinks: number;
  scheduled: number;
  samples: string[];
}

export interface StoreInfo {
  dataFile: string;
  dataDir: string;
  backupDir: string;
  appVersion: string;
  backupCount: number;
}

export interface OpResult {
  ok: boolean;
  /** Đường dẫn file đã ghi, nếu có. */
  path?: string;
  /** Lý do thất bại, để hiển thị cho người dùng. */
  error?: string;
  /** Người dùng bấm huỷ ở hộp thoại chọn file. */
  cancelled?: boolean;
}

/** Cầu nối được preload gắn vào window.denken. */
export interface DenkenBridge {
  load(): Promise<AppData>;
  save(data: AppData): Promise<OpResult>;
  info(): Promise<StoreInfo>;
  exportJson(): Promise<OpResult>;
  exportXlsx(): Promise<OpResult>;
  importJson(): Promise<OpResult & { data?: AppData }>;
  /** Nhập tiến độ từ file Excel gốc — cách đưa dữ liệu riêng của bạn vào app. */
  importXlsx(): Promise<OpResult & { data?: AppData; report?: ImportReport }>;
  /** Đọc nguyên văn một file sao lưu người dùng chọn, để giao diện tự gộp. */
  pickJsonText(): Promise<OpResult & { text?: string }>;
  /** Kho phụ cạnh data.json: cấu hình đồng bộ (có token) và bản chụp lần trước. */
  sideRead(name: string): Promise<string | null>;
  sideWrite(name: string, text: string): Promise<OpResult>;
  revealDataFolder(): Promise<OpResult>;
  /** Chọn thư mục nhân bản (thường là thư mục Google Drive trên máy). */
  pickMirrorDir(): Promise<OpResult & { dir?: string }>;
  /** Nhân bản ngay lập tức, không chờ lần ghi kế tiếp. */
  mirrorNow(): Promise<OpResult & { files?: number }>;
  /** Xuất gói .zip gồm cả dữ liệu lẫn file đính kèm. */
  exportZip(): Promise<OpResult & { bytes?: number }>;
  openExternal(url: string): Promise<OpResult>;

  /** Mở hộp thoại chọn file, chép vào thư mục dữ liệu, trả về mô tả file. */
  attachPick(): Promise<OpResult & { attachments?: Attachment[] }>;
  /** Lưu file dán từ clipboard hoặc kéo thả. */
  attachSave(
    name: string,
    bytes: ArrayBuffer,
  ): Promise<OpResult & { attachment?: Attachment }>;
  /** Đọc file ảnh thành data URL để hiện ngay trong app. */
  attachDataUrl(file: string): Promise<OpResult & { dataUrl?: string }>;
  /** Mở file bằng ứng dụng mặc định của hệ điều hành. */
  attachOpen(file: string): Promise<OpResult>;
  /** Xoá file khỏi thư mục dữ liệu. */
  attachDelete(file: string): Promise<OpResult>;
}

declare global {
  interface Window {
    denken: DenkenBridge;
  }
}
