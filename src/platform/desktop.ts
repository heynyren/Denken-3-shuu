/**
 * Nền tảng Windows — chuyển tiếp thẳng sang cầu nối `window.denken` mà preload
 * của Electron gắn vào. Toàn bộ việc nặng nằm ở tiến trình chính (electron/).
 */

import type { OpResult } from "../lib/types";
import type { Platform } from "./types";

/**
 * Lời nhắc hết giờ trên Windows.
 *
 * Không cần plugin gì: cửa sổ Electron vẫn được cấp nhịp chạy khi bị che hay
 * thu nhỏ (main.ts tắt `backgroundThrottling`), nên hẹn giờ ngay trong app là
 * đủ. Thông báo hiện ở góc màn hình Windows, bấm vào là app nhảy lên trước.
 */
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function clearTimer(id: number): void {
  const timer = timers.get(id);
  if (timer !== undefined) {
    clearTimeout(timer);
    timers.delete(id);
  }
}

export const desktop: Platform = {
  kind: "desktop",
  can: {
    excelImport: true,
    excelExport: true,
    mirrorFolder: true,
    revealFolder: true,
    attachments: true,
    mergeFile: true,
    cloudSync: true,
  },

  load: () => window.denken.load(),
  save: (data) => window.denken.save(data),
  info: () => window.denken.info(),

  exportJson: () => window.denken.exportJson(),
  exportXlsx: () => window.denken.exportXlsx(),
  exportZip: () => window.denken.exportZip(),
  importJson: () => window.denken.importJson(),
  importXlsx: () => window.denken.importXlsx(),

  revealDataFolder: () => window.denken.revealDataFolder(),
  pickMirrorDir: () => window.denken.pickMirrorDir(),
  mirrorNow: () => window.denken.mirrorNow(),

  pickJsonText: () => window.denken.pickJsonText(),

  sideRead: (name) => window.denken.sideRead(name),
  sideWrite: (name, text) => window.denken.sideWrite(name, text),

  openExternal: (url) => window.denken.openExternal(url),

  // Windows không có nút Quay lại của hệ điều hành.
  onBack: () => () => undefined,
  exitApp: () => undefined,

  async notifyAt(id, at, title, body): Promise<OpResult> {
    clearTimer(id);
    const wait = at - Date.now();
    if (wait <= 0) return { ok: false, error: "Mốc giờ đã qua." };
    timers.set(
      id,
      setTimeout(() => {
        timers.delete(id);
        try {
          new Notification(title, { body, requireInteraction: true });
        } catch {
          // Người dùng tắt thông báo ở Windows — chuông trong app vẫn reo.
        }
      }, wait),
    );
    return { ok: true };
  },

  async cancelNotify(id): Promise<OpResult> {
    clearTimer(id);
    return { ok: true };
  },

  attachPick: () => window.denken.attachPick(),
  attachSave: (name, bytes) => window.denken.attachSave(name, bytes),
  attachDataUrl: (file) => window.denken.attachDataUrl(file),
  attachOpen: (file) => window.denken.attachOpen(file),
  attachDelete: (file) => window.denken.attachDelete(file),
};
