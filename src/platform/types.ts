/**
 * Lớp cầu nối giữa giao diện và nền tảng bên dưới.
 *
 * Toàn bộ ràng buộc của app với Windows hay Android gói gọn ở đây. Giao diện,
 * chu kỳ ôn, engine thi thử, thống kê — không chỗ nào được gọi thẳng
 * `window.denken` hay một plugin Capacitor nào nữa; tất cả đi qua interface này.
 *
 * Nhờ vậy thêm một nền tảng chỉ là viết thêm một file trong thư mục này, chứ
 * không phải rà lại 22 chỗ gọi rải rác trong 7 file như trước.
 */

import type {
  AppData,
  Attachment,
  ImportReport,
  OpResult,
  StoreInfo,
} from "../lib/types";

/**
 * Việc nào nền tảng này làm được.
 *
 * Không phải nền tảng nào cũng làm được mọi thứ: Android không có "mở thư mục
 * dữ liệu trong File Explorer", cũng không có thư mục Google Drive gắn sẵn trên
 * đĩa để nhân bản vào. Giao diện đọc cờ ở đây để **ẩn hẳn** nút không dùng
 * được, thay vì cho bấm rồi báo lỗi.
 */
export interface Capabilities {
  /** Nhập tiến độ từ file Excel gốc. */
  excelImport: boolean;
  /** Xuất ra file Excel giống bố cục gốc. */
  excelExport: boolean;
  /** Nhân bản dữ liệu sang một thư mục trên đĩa (thư mục Drive/OneDrive). */
  mirrorFolder: boolean;
  /** Mở thư mục dữ liệu bằng trình quản lý file của hệ điều hành. */
  revealFolder: boolean;
  /** Đính kèm ảnh/PDF vào ghi chú. */
  attachments: boolean;
  /** Gộp dữ liệu từ một file sao lưu của máy khác. */
  mergeFile: boolean;
}

/** Mã lời nhắc hết giờ. Mỗi màn một mã để huỷ đúng cái của mình. */
export const ALARM_REVIEW = 1;
export const ALARM_EXAM = 2;

export interface Platform {
  readonly kind: "desktop" | "android";
  readonly can: Capabilities;

  /* --- dữ liệu --- */
  load(): Promise<AppData>;
  save(data: AppData): Promise<OpResult>;
  info(): Promise<StoreInfo>;

  /* --- xuất / nhập --- */
  exportJson(): Promise<OpResult>;
  exportXlsx(): Promise<OpResult>;
  exportZip(): Promise<OpResult & { bytes?: number }>;
  importJson(): Promise<OpResult & { data?: AppData }>;
  importXlsx(): Promise<OpResult & { data?: AppData; report?: ImportReport }>;

  /* --- chỗ chứa dữ liệu --- */
  revealDataFolder(): Promise<OpResult>;
  pickMirrorDir(): Promise<OpResult & { dir?: string }>;
  mirrorNow(): Promise<OpResult & { files?: number }>;

  /** Đọc một file sao lưu người dùng chọn, trả về nguyên văn để bên ngoài gộp. */
  pickJsonText(): Promise<OpResult & { text?: string }>;

  /* --- linh tinh --- */
  openExternal(url: string): Promise<OpResult>;

  /* --- lời nhắc hết giờ --- */
  /**
   * Hẹn một lời nhắc nổ vào đúng mốc `at` (mili giây kiểu `Date.now()`).
   *
   * Chuông trong app chỉ reo được khi app còn đang chạy và còn được cấp nhịp
   * chạy. Mà đúng quy trình làm bài thì bạn bấm mở đề rồi rời khỏi app sang
   * trình duyệt — lúc đó Android hãm hết mọi setInterval, chuông không bao giờ
   * kêu. Lời nhắc này do hệ điều hành giữ, nên nổ đúng giờ kể cả khi app đang
   * chạy nền hay màn hình đã tắt.
   */
  notifyAt(id: number, at: number, title: string, body: string): Promise<OpResult>;
  /** Huỷ lời nhắc đã hẹn — tắt đồng hồ, nộp bài sớm, đổi bài. */
  cancelNotify(id: number): Promise<OpResult>;

  /* --- file đính kèm --- */
  attachPick(): Promise<OpResult & { attachments?: Attachment[] }>;
  attachSave(
    name: string,
    bytes: ArrayBuffer,
  ): Promise<OpResult & { attachment?: Attachment }>;
  attachDataUrl(file: string): Promise<OpResult & { dataUrl?: string }>;
  attachOpen(file: string): Promise<OpResult>;
  attachDelete(file: string): Promise<OpResult>;
}

/** Việc nền tảng không làm được — trả lời tử tế thay vì ném lỗi. */
export function unsupported(what: string): OpResult {
  return { ok: false, error: `${what} chưa dùng được trên nền tảng này.` };
}
