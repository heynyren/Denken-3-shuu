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
  name: string;
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

/** Tiến độ của một bài. Đây là dữ liệu của người dùng. */
export interface ItemProgress {
  status: ItemStatus;
  note: string;
  /** Link tham khảo riêng của từng người (Gemini, ghi chú, video…). */
  refLink: string;
  doneDate: string | null;
  /** 0 = chưa vào chu kỳ ôn; 1..6 ứng với 1/3/7/14/30/90 ngày. */
  srsLevel: number;
  nextReview: string | null;
  history: ReviewEvent[];
}

export interface QuizletDeck {
  id: string;
  subject: string;
  name: string;
  url: string;
  remaining: number;
  total: number;
}

export interface VocabEntry {
  id: string;
  term: string;
  reading: string;
  meaning: string;
  hint: string;
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
  /** Ngày thi, dạng YYYY-MM-DD. Người dùng tự chỉnh trong Cài đặt. */
  examDate: string;
  /** Số ngày tối đa giữ bản sao lưu tự động. */
  backupsToKeep: number;
}

export interface AppData {
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  settings: Settings;
  progress: Record<string, ItemProgress>;
  decks: QuizletDeck[];
  vocab: VocabEntry[];
  dailyLog: Record<string, DayLog>;
  /** id huy hiệu -> ngày đạt được (YYYY-MM-DD). */
  badges: Record<string, string>;
}

/** Kết quả sau một lần nhập từ Excel, để báo lại cho người dùng. */
export interface ImportReport {
  matched: number;
  unmatched: number;
  notes: number;
  refLinks: number;
  scheduled: number;
  decks: number;
  vocab: number;
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
  revealDataFolder(): Promise<OpResult>;
  openExternal(url: string): Promise<OpResult>;
}

declare global {
  interface Window {
    denken: DenkenBridge;
  }
}
