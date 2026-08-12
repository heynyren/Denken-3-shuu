/**
 * Nền tảng Windows — chuyển tiếp thẳng sang cầu nối `window.denken` mà preload
 * của Electron gắn vào. Toàn bộ việc nặng nằm ở tiến trình chính (electron/).
 */

import type { Platform } from "./types";

export const desktop: Platform = {
  kind: "desktop",
  can: {
    excelImport: true,
    excelExport: true,
    mirrorFolder: true,
    revealFolder: true,
    attachments: true,
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

  openExternal: (url) => window.denken.openExternal(url),

  attachPick: () => window.denken.attachPick(),
  attachSave: (name, bytes) => window.denken.attachSave(name, bytes),
  attachDataUrl: (file) => window.denken.attachDataUrl(file),
  attachOpen: (file) => window.denken.attachOpen(file),
  attachDelete: (file) => window.denken.attachDelete(file),
};
