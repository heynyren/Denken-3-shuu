/**
 * Chọn nền tảng lúc chạy.
 *
 * Giao diện chỉ nhập `platform` từ đây và gọi như nhau ở cả hai bên. Không chỗ
 * nào trong `src/views` hay `src/components` được biết mình đang chạy trên
 * Windows hay Android — trừ khi hỏi `platform.can.*` để ẩn nút không dùng được.
 */

import { android } from "./android";
import { desktop } from "./desktop";
import type { Platform } from "./types";

declare global {
  interface Window {
    // Capacitor gắn biến này vào window khi chạy trong app Android.
    Capacitor?: { isNativePlatform?: () => boolean };
  }
}

function detect(): Platform {
  return window.Capacitor?.isNativePlatform?.() ? android : desktop;
}

export const platform: Platform = detect();
export type { Capabilities, Platform } from "./types";
