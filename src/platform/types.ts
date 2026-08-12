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
}

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

  /* --- linh tinh --- */
  openExternal(url: string): Promise<OpResult>;

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
