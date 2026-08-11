/**
 * Cầu nối duy nhất giữa giao diện và tiến trình chính.
 *
 * Giao diện chỉ nhìn thấy đúng những hàm liệt kê ở đây — không có `require`,
 * không có `fs`, không có `ipcRenderer` trần. Muốn thêm quyền gì cho giao diện
 * thì phải thêm một hàm ở đây và một handler tương ứng bên main.ts.
 */

import { contextBridge, ipcRenderer } from "electron";

import type { AppData, DenkenBridge } from "../src/lib/types";

const bridge: DenkenBridge = {
  load: () => ipcRenderer.invoke("store:load"),
  save: (data: AppData) => ipcRenderer.invoke("store:save", data),
  info: () => ipcRenderer.invoke("store:info"),
  exportJson: () => ipcRenderer.invoke("store:export-json"),
  exportXlsx: () => ipcRenderer.invoke("store:export-xlsx"),
  importJson: () => ipcRenderer.invoke("store:import-json"),
  importXlsx: () => ipcRenderer.invoke("store:import-xlsx"),
  revealDataFolder: () => ipcRenderer.invoke("store:reveal"),
  openExternal: (url: string) => ipcRenderer.invoke("shell:open-external", url),
};

contextBridge.exposeInMainWorld("denken", bridge);
