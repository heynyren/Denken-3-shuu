/**
 * Tiến trình chính của Electron: mở cửa sổ và làm người gác cổng.
 *
 * Giao diện chạy trong môi trường cách ly, không đụng được vào ổ đĩa.
 * Mọi thao tác đọc/ghi file và mở link đều phải đi qua các kênh IPC dưới đây,
 * nên phạm vi những gì giao diện có thể làm là đúng bằng danh sách này.
 */

import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from "electron";
import path from "node:path";
import { promises as fs } from "node:fs";

import * as attachments from "./attachments";
import { writeWorkbook } from "./export-xlsx";
import { importWorkbook } from "./import-xlsx";
import { exportZip, mirrorTo } from "./mirror";
import type { ImportReport } from "./import-xlsx";
import { countBackups, load, normalise, paths, referencedFiles, save } from "./store";
import type { Attachment, AppData, OpResult, StoreInfo } from "../src/lib/types";

const isDev = process.env.NODE_ENV === "development";
const DEV_URL = "http://localhost:5173";

/**
 * Khoá cứng thư mục dữ liệu. KHÔNG BAO GIỜ đổi chuỗi này.
 *
 * Mặc định Electron đặt tên thư mục dữ liệu theo productName của bản đóng gói.
 * Nếu sau này ai đó đổi productName trong electron-builder.yml, Electron sẽ trỏ
 * sang thư mục khác và người dùng mở app lên thấy trống trơn — đúng cái tai nạn
 * mà cả thiết kế này sinh ra để tránh.
 *
 * `setName` thôi thì chưa chắc, vì nó chỉ có tác dụng nếu chạy trước lần đầu
 * đọc userData. Nên gọi thẳng `setPath` để đường dẫn là tuyệt đối tất định:
 *
 *   Windows  %APPDATA%\Denken 3-shuu\data.json
 *   macOS    ~/Library/Application Support/Denken 3-shuu/data.json
 *   Linux    ~/.config/Denken 3-shuu/data.json
 */
const DATA_DIR_NAME = "Denken 3-shuu";
app.setName(DATA_DIR_NAME);
app.setPath("userData", path.join(app.getPath("appData"), DATA_DIR_NAME));

let mainWindow: BrowserWindow | null = null;

/* ------------------------------------------------------------------ */
/* Cửa sổ                                                              */
/* ------------------------------------------------------------------ */

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 900,
    minWidth: 1000,
    minHeight: 680,
    show: false,
    backgroundColor: "#0e1420",
    title: "電験三種 — Sổ ôn thi",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());

  // Link ngoài luôn mở bằng trình duyệt mặc định, không mở cửa sổ Electron mới.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void openExternal(url);
    return { action: "deny" };
  });

  // Chặn mọi điều hướng ra khỏi giao diện của app.
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (isDev && url.startsWith(DEV_URL)) return;
    event.preventDefault();
    void openExternal(url);
  });

  if (isDev) {
    void mainWindow.loadURL(DEV_URL);
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/* ------------------------------------------------------------------ */
/* Mở link ra ngoài                                                    */
/* ------------------------------------------------------------------ */

/** Chỉ cho phép http/https — chặn file:, javascript: và các giao thức khác. */
async function openExternal(rawUrl: string): Promise<OpResult> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, error: "Link không hợp lệ." };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: `Không mở được link dạng ${parsed.protocol}` };
  }
  await shell.openExternal(parsed.toString());
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Tên file gợi ý khi xuất dữ liệu                                     */
/* ------------------------------------------------------------------ */

function stamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
}

/* ------------------------------------------------------------------ */
/* Kênh IPC                                                            */
/* ------------------------------------------------------------------ */

function registerHandlers(): void {
  ipcMain.handle("store:load", async (): Promise<AppData> => load());

  ipcMain.handle("store:save", async (_event, data: AppData): Promise<OpResult> => {
    try {
      // Không tin thẳng dữ liệu từ giao diện: vá lại cho đúng khuôn rồi mới ghi.
      const clean = normalise(data);
      await save(clean);

      // Nhân bản chạy sau lưng và không được phép làm hỏng thao tác ghi chính:
      // thư mục Drive có thể đang bận, ổ ngoài có thể đã rút ra.
      const target = clean.settings.mirrorDir;
      if (target) void mirrorTo(target).catch(() => undefined);

      return { ok: true };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  });

  ipcMain.handle("mirror:pick", async (): Promise<OpResult & { dir?: string }> => {
    const picked = await dialog.showOpenDialog(mainWindow!, {
      title: "Chọn thư mục để nhân bản dữ liệu (nên chọn trong Google Drive)",
      properties: ["openDirectory", "createDirectory"],
    });
    if (picked.canceled || !picked.filePaths[0]) return { ok: false, cancelled: true };
    return { ok: true, dir: picked.filePaths[0] };
  });

  ipcMain.handle("mirror:now", async (): Promise<OpResult & { files?: number }> => {
    const target = (await load()).settings.mirrorDir;
    if (!target) return { ok: false, error: "Chưa chọn thư mục nhân bản." };
    try {
      const report = await mirrorTo(target);
      return { ok: true, path: target, files: report.filesCopied };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  });

  ipcMain.handle("store:export-zip", async (): Promise<OpResult & { bytes?: number }> => {
    const target = await dialog.showSaveDialog(mainWindow!, {
      title: "Xuất toàn bộ dữ liệu kèm file đính kèm",
      defaultPath: `denken-toan-bo-${stamp()}.zip`,
      filters: [{ name: "ZIP", extensions: ["zip"] }],
    });
    if (target.canceled || !target.filePath) return { ok: false, cancelled: true };
    try {
      const { bytes } = await exportZip(target.filePath);
      return { ok: true, path: target.filePath, bytes };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  });

  ipcMain.handle("store:info", async (): Promise<StoreInfo> => ({
    dataFile: paths.file,
    dataDir: paths.dir,
    backupDir: paths.backupDir,
    appVersion: app.getVersion(),
    backupCount: await countBackups(),
  }));

  ipcMain.handle("store:export-json", async (): Promise<OpResult> => {
    const target = await dialog.showSaveDialog(mainWindow!, {
      title: "Xuất dữ liệu ra file JSON",
      defaultPath: `denken-backup-${stamp()}.json`,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (target.canceled || !target.filePath) return { ok: false, cancelled: true };

    try {
      const data = await load();
      await fs.writeFile(target.filePath, JSON.stringify(data, null, 2), "utf8");
      return { ok: true, path: target.filePath };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  });

  ipcMain.handle("store:export-xlsx", async (): Promise<OpResult> => {
    const target = await dialog.showSaveDialog(mainWindow!, {
      title: "Xuất dữ liệu ra file Excel",
      defaultPath: `Bai tap dien hang 3 - ${stamp()}.xlsx`,
      filters: [{ name: "Excel", extensions: ["xlsx"] }],
    });
    if (target.canceled || !target.filePath) return { ok: false, cancelled: true };

    try {
      await writeWorkbook(target.filePath, await load());
      return { ok: true, path: target.filePath };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(
    "store:import-json",
    async (): Promise<OpResult & { data?: AppData }> => {
      const picked = await dialog.showOpenDialog(mainWindow!, {
        title: "Chọn file sao lưu để khôi phục",
        filters: [{ name: "JSON", extensions: ["json"] }],
        properties: ["openFile"],
      });
      if (picked.canceled || !picked.filePaths[0]) return { ok: false, cancelled: true };

      let incoming: AppData;
      try {
        incoming = normalise(JSON.parse(await fs.readFile(picked.filePaths[0], "utf8")));
      } catch (error) {
        return { ok: false, error: `File không đọc được: ${(error as Error).message}` };
      }

      const entries = Object.keys(incoming.progress).length;
      const confirm = await dialog.showMessageBox(mainWindow!, {
        type: "warning",
        buttons: ["Huỷ", "Ghi đè dữ liệu hiện tại"],
        defaultId: 0,
        cancelId: 0,
        title: "Xác nhận khôi phục",
        message: `Khôi phục ${entries} bài từ file sao lưu?`,
        detail:
          "Toàn bộ tiến độ hiện tại sẽ bị thay thế. " +
          "Bản hiện tại vẫn còn trong thư mục backups nếu bạn cần lấy lại.",
      });
      if (confirm.response !== 1) return { ok: false, cancelled: true };

      try {
        await save(incoming);
        return { ok: true, path: picked.filePaths[0], data: incoming };
      } catch (error) {
        return { ok: false, error: (error as Error).message };
      }
    },
  );

  ipcMain.handle(
    "store:import-xlsx",
    async (): Promise<OpResult & { data?: AppData; report?: ImportReport }> => {
      const picked = await dialog.showOpenDialog(mainWindow!, {
        title: "Chọn file Excel bài tập điện hạng 3",
        filters: [{ name: "Excel", extensions: ["xlsx", "xlsm"] }],
        properties: ["openFile"],
      });
      if (picked.canceled || !picked.filePaths[0]) return { ok: false, cancelled: true };

      let outcome: Awaited<ReturnType<typeof importWorkbook>>;
      try {
        outcome = await importWorkbook(picked.filePaths[0], await load());
      } catch (error) {
        return { ok: false, error: `Không đọc được file: ${(error as Error).message}` };
      }

      const { report } = outcome;
      const confirm = await dialog.showMessageBox(mainWindow!, {
        type: "question",
        buttons: ["Huỷ", "Nhập dữ liệu"],
        defaultId: 1,
        cancelId: 0,
        title: "Xác nhận nhập từ Excel",
        message: `Khớp được ${report.matched} bài trong file Excel.`,
        detail:
          `Sẽ nhập: ${report.notes} ghi chú, ${report.refLinks} link tham khảo, ` +
          `${report.scheduled} bài đang trong chu kỳ ôn.\n\n` +
          (report.unmatched > 0
            ? `${report.unmatched} dòng không khớp bài nào trong danh mục và sẽ bị bỏ qua.\n\n`
            : "") +
          "Tiến độ hiện có của các bài trùng sẽ bị ghi đè bằng dữ liệu trong Excel.",
      });
      if (confirm.response !== 1) return { ok: false, cancelled: true };

      try {
        await save(outcome.data);
        return { ok: true, path: picked.filePaths[0], data: outcome.data, report };
      } catch (error) {
        return { ok: false, error: (error as Error).message };
      }
    },
  );

  ipcMain.handle("store:reveal", async (): Promise<OpResult> => {
    await shell.openPath(paths.dir);
    return { ok: true, path: paths.dir };
  });

  ipcMain.handle("shell:open-external", async (_event, url: string) => openExternal(url));

  /* ------------------------ File đính kèm ------------------------ */

  ipcMain.handle(
    "attach:pick",
    async (): Promise<OpResult & { attachments?: Attachment[] }> => {
      const picked = await dialog.showOpenDialog(mainWindow!, {
        title: "Chọn file đính kèm vào ghi chú",
        properties: ["openFile", "multiSelections"],
        filters: [
          {
            name: "Ảnh và tài liệu",
            extensions: ["png", "jpg", "jpeg", "gif", "webp", "bmp", "pdf", "docx", "doc"],
          },
          { name: "Tất cả", extensions: ["*"] },
        ],
      });
      if (picked.canceled || picked.filePaths.length === 0) {
        return { ok: false, cancelled: true };
      }

      const saved: Attachment[] = [];
      const failed: string[] = [];
      for (const source of picked.filePaths) {
        try {
          saved.push(await attachments.copyIn(source));
        } catch (error) {
          failed.push((error as Error).message);
        }
      }
      // Chép được file nào tính file nấy; chỉ báo lỗi khi không được file nào.
      if (saved.length === 0) return { ok: false, error: failed.join("\n") };
      return { ok: true, attachments: saved, error: failed.join("\n") || undefined };
    },
  );

  ipcMain.handle(
    "attach:save",
    async (
      _event,
      name: string,
      bytes: ArrayBuffer,
    ): Promise<OpResult & { attachment?: Attachment }> => {
      try {
        const saved = await attachments.writeBytes(name, new Uint8Array(bytes));
        return { ok: true, attachment: saved };
      } catch (error) {
        return { ok: false, error: (error as Error).message };
      }
    },
  );

  ipcMain.handle(
    "attach:data-url",
    async (_event, file: string): Promise<OpResult & { dataUrl?: string }> => {
      try {
        return { ok: true, dataUrl: await attachments.dataUrl(file) };
      } catch (error) {
        return { ok: false, error: (error as Error).message };
      }
    },
  );

  ipcMain.handle("attach:open", async (_event, file: string): Promise<OpResult> => {
    try {
      await attachments.openWithSystem(file);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  });

  ipcMain.handle("attach:delete", async (_event, file: string): Promise<OpResult> => {
    try {
      await attachments.remove(file);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  });
}

/* ------------------------------------------------------------------ */
/* Vòng đời                                                            */
/* ------------------------------------------------------------------ */

// Một bản chạy duy nhất: hai cửa sổ cùng ghi vào data.json sẽ đè lên nhau.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    registerHandlers();
    createWindow();

    // Xoá ghi chú chỉ bỏ phần mô tả trong data.json, file vẫn nằm lại trên đĩa.
    // Dọn một lượt lúc khởi động để thư mục đính kèm không phình mãi.
    void load()
      .then((data) => attachments.pruneOrphans(referencedFiles(data)))
      .catch(() => 0);

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
