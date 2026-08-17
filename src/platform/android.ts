/**
 * Nền tảng Android.
 *
 * File này chỉ còn phần **nối vào Capacitor**: gọi plugin, bắt sự kiện của hệ
 * điều hành, chọn file, chia sẻ ra ngoài. Toàn bộ lý lẽ ghi/đọc/cứu hộ dữ liệu
 * nằm ở `kho-android.ts` — tách ra để kiểm thử được ngoài điện thoại, sau khi
 * một lỗi mất sạch dữ liệu nằm im ở đây suốt nhiều bản mà không ai đo được.
 *
 * Dữ liệu nằm trong thư mục riêng của app (`Directory.Data`): cập nhật app thì
 * không đụng tới — giống `%APPDATA%` bên Windows. Nhưng **gỡ app là mất hết**,
 * mà APK ký bằng khoá khác nhau thì Android bắt gỡ mới cài được; xem
 * `docs/KHOA-KY-ANDROID.md`.
 */

import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Share } from "@capacitor/share";
import { StatusBar, Style } from "@capacitor/status-bar";

import type { Attachment, AttachmentKind, OpResult } from "../lib/types";
import type { TepAndroid } from "./kho-android";
import { BACKUPS, FILE, taoKhoAndroid } from "./kho-android";
import type { Platform } from "./types";
import { sideName, unsupported } from "./types";

const DIR = Directory.Data;
const ATTACHMENTS = "attachments";
/** Chặn ảnh quá lớn, giống bản Windows. */
const MAX_FILE_BYTES = 25 * 1024 * 1024;

/* ------------------------------------------------------------------ */
/* Tiện ích file                                                       */
/* ------------------------------------------------------------------ */

async function ensureDir(path: string): Promise<void> {
  try {
    await Filesystem.mkdir({ path, directory: DIR, recursive: true });
  } catch {
    // Đã có sẵn thì mkdir ném lỗi — đúng như mong đợi, bỏ qua.
  }
}

async function readText(path: string): Promise<string | null> {
  try {
    const result = await Filesystem.readFile({
      path,
      directory: DIR,
      encoding: Encoding.UTF8,
    });
    return typeof result.data === "string" ? result.data : null;
  } catch {
    return null;
  }
}

async function listDir(path: string): Promise<string[]> {
  try {
    const result = await Filesystem.readdir({ path, directory: DIR });
    return result.files.map((entry) => entry.name);
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Kho dữ liệu                                                         */
/* ------------------------------------------------------------------ */

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Nối Capacitor vào kho.
 *
 * Toàn bộ lý lẽ ghi/đọc/cứu hộ nằm trong `kho-android.ts` và chạy được ngoài
 * điện thoại, nên kiểm thử được. Ở đây chỉ còn đúng sáu thao tác đĩa.
 */
const tep: TepAndroid = {
  doc: readText,
  async ghi(path, text) {
    await Filesystem.writeFile({
      path,
      directory: DIR,
      data: text,
      encoding: Encoding.UTF8,
      recursive: true,
    });
  },
  async xoa(path) {
    await Filesystem.deleteFile({ path, directory: DIR });
  },
  async doiTen(from, to) {
    await Filesystem.rename({ from, to, directory: DIR, toDirectory: DIR });
  },
  liet: listDir,
  taoThuMuc: ensureDir,
};

const kho = taoKhoAndroid(tep);

/* ------------------------------------------------------------------ */
/* Chuyển đổi nhị phân                                                 */
/* ------------------------------------------------------------------ */

export function bytesToBase64(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  let binary = "";
  // Cắt từng khúc: đẩy cả mảng vài chục MB vào String.fromCharCode là tràn stack.
  const CHUNK = 0x8000;
  for (let i = 0; i < view.length; i += CHUNK) {
    binary += String.fromCharCode(...view.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

const EXTENSION_KIND: Record<string, AttachmentKind> = {
  png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image",
  pdf: "pdf", doc: "docx", docx: "docx",
};

function kindOf(name: string): AttachmentKind {
  return EXTENSION_KIND[name.split(".").pop()?.toLowerCase() ?? ""] ?? "other";
}

const MIME: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", webp: "image/webp", pdf: "application/pdf",
};

/**
 * Tên file trong thư mục đính kèm — luôn là tên trơn, không có đường dẫn.
 * Chặn `../` ngay từ đây, đúng như `resolveSafe()` bên Windows.
 */
export function safeName(file: string): string | null {
  if (!file || file.includes("/") || file.includes("\\") || file.includes("..")) {
    return null;
  }
  return file;
}

let counter = 0;
function newFileName(original: string): string {
  const ext = original.includes(".") ? original.split(".").pop() : "bin";
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}.${ext}`;
}

/* ------------------------------------------------------------------ */
/* Chia sẻ file ra ngoài                                               */
/* ------------------------------------------------------------------ */

/**
 * Android không có hộp thoại "lưu file vào đâu" như Windows. Cách tương đương
 * là ghi ra thư mục tạm rồi mở khay chia sẻ, để người dùng tự chọn gửi đi đâu —
 * Drive, Gmail, Files, tuỳ họ.
 */
async function shareText(name: string, text: string, title: string): Promise<OpResult> {
  try {
    await Filesystem.writeFile({
      path: name,
      directory: Directory.Cache,
      data: text,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    const { uri } = await Filesystem.getUri({ path: name, directory: Directory.Cache });
    await Share.share({ title, url: uri });
    return { ok: true, path: uri };
  } catch (cause) {
    const message = (cause as Error).message ?? String(cause);
    // Người dùng đóng khay chia sẻ không phải là lỗi.
    if (/cancel/i.test(message)) return { ok: false, cancelled: true };
    return { ok: false, error: message };
  }
}

/* ------------------------------------------------------------------ */
/* Nền tảng                                                            */
/* ------------------------------------------------------------------ */

/**
 * Dọn thanh trạng thái ngay lúc app khởi động.
 *
 * Android 15 trở đi ép mọi app vẽ tràn ra sau thanh trạng thái, nên nếu không
 * làm gì thì đồng hồ, pin và biểu tượng thông báo của máy nằm đè lên phần đầu
 * app. Hai việc phải làm, thiếu cái nào cũng còn lỗi:
 *
 *   1. Đặt màu chữ của thanh trạng thái thành SÁNG — nền app tối, để chữ tối
 *      thì không đọc được giờ với phần trăm pin.
 *   2. Tô nền thanh đó cùng màu với thanh đầu app, cho liền một khối.
 *
 * Còn phần chừa chỗ thì nằm ở CSS (`env(safe-area-inset-top)`), vì chỉ CSS mới
 * biết bố cục bên trong sắp xếp ra sao.
 */
void (async () => {
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#1c1c1e" });
  } catch {
    // Máy cũ hoặc bản Android không cho đổi thì thôi, phần chừa chỗ bằng CSS
    // vẫn còn tác dụng.
  }
})();

export const android: Platform = {
  kind: "android",
  can: {
    // Đọc Excel cần exceljs chạy ngay trong webview và một bộ chọn file riêng.
    // Bản đầu chưa làm: nhập trên máy tính rồi đồng bộ sang là đủ.
    excelImport: false,
    excelExport: false,
    // Android không có thư mục Google Drive gắn sẵn trên đĩa để chép vào.
    // Việc của nó là đồng bộ qua Drive API, không phải nhân bản thư mục.
    mirrorFolder: false,
    revealFolder: false,
    attachments: true,
    mergeFile: true,
    cloudSync: true,
  },

  async load() {
    await ensureDir(ATTACHMENTS);
    return kho.load();
  },

  save(data) {
    return kho.save(data);
  },

  async info() {
    const { uri } = await Filesystem.getUri({ path: FILE, directory: DIR });
    const version = await App.getInfo()
      .then((entry) => entry.version)
      .catch(() => "");
    return {
      dataFile: uri,
      dataDir: uri.replace(/\/[^/]+$/, ""),
      backupDir: uri.replace(/\/[^/]+$/, `/${BACKUPS}`),
      appVersion: version,
      backupCount: (await listDir(BACKUPS)).filter((n) => n.endsWith(".json")).length,
    };
  },

  async exportJson() {
    const text = await readText(FILE);
    if (text === null) return { ok: false, error: "Chưa có dữ liệu để xuất." };
    return shareText(`denken-${today()}.json`, text, "Sao lưu sổ ôn thi");
  },

  async exportXlsx() {
    return unsupported("Xuất ra Excel");
  },

  async exportZip() {
    // Gói .zip cần nén cả thư mục đính kèm; bản đầu chưa làm.
    // Xuất JSON vẫn giữ được toàn bộ tiến độ, ghi chú và link tham khảo.
    return unsupported("Xuất gói .zip");
  },

  async importJson() {
    return unsupported("Nhập từ file JSON");
  },

  async importXlsx() {
    return unsupported("Nhập từ file Excel");
  },

  async revealDataFolder() {
    return unsupported("Mở thư mục dữ liệu");
  },

  async pickMirrorDir() {
    return unsupported("Chọn thư mục nhân bản");
  },

  async mirrorNow() {
    return unsupported("Nhân bản thư mục");
  },

  async pickJsonText() {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json,.json";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return resolve({ ok: false, cancelled: true });
        try {
          resolve({ ok: true, text: await file.text(), path: file.name });
        } catch (cause) {
          resolve({ ok: false, error: (cause as Error).message });
        }
      };
      input.click();
    });
  },

  async sideRead(name) {
    const safe = sideName(name);
    if (!safe) return null;
    return readText(safe);
  },

  async sideWrite(name, text) {
    const safe = sideName(name);
    if (!safe) return { ok: false, error: "Tên file không hợp lệ." };
    try {
      await Filesystem.writeFile({
        path: safe,
        directory: DIR,
        data: text,
        encoding: Encoding.UTF8,
        recursive: true,
      });
      return { ok: true, path: safe };
    } catch (cause) {
      return { ok: false, error: (cause as Error).message };
    }
  },

  async openExternal(url) {
    if (!/^https?:\/\//i.test(url)) return { ok: false, error: "Link không hợp lệ." };
    await Browser.open({ url });
    return { ok: true };
  },

  onBack(handler) {
    // `addListener` trả về Promise, mà chỗ gọi cần hàm huỷ ngay lập tức — nên
    // giữ lời hứa lại rồi huỷ khi nó xong.
    const dangKy = App.addListener("backButton", () => handler());
    return () => {
      void dangKy.then((moc) => moc.remove());
    };
  },

  exitApp() {
    void App.exitApp();
  },

  onPause(handler) {
    // Hai nguồn tin, cố ý nghe cả hai. `appStateChange` là tin chuẩn của
    // Capacitor nhưng nó chạy qua cầu nối native nên có độ trễ; `visibilitychange`
    // do chính WebView phát, tới sớm hơn. App bị giết gấp thì vài mili giây ấy
    // là khoảng cách giữa còn dữ liệu và mất dữ liệu.
    const anDi = () => {
      if (document.hidden) handler();
    };
    document.addEventListener("visibilitychange", anDi);
    const dangKy = App.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) handler();
    });
    return () => {
      document.removeEventListener("visibilitychange", anDi);
      void dangKy.then((moc) => moc.remove());
    };
  },

  async notifyAt(id, at, title, body) {
    if (at - Date.now() <= 0) return { ok: false, error: "Mốc giờ đã qua." };
    try {
      // Android 13 trở lên phải xin quyền thông báo; hỏi ngay lần hẹn đầu tiên.
      let allowed = (await LocalNotifications.checkPermissions()).display;
      if (allowed !== "granted") {
        allowed = (await LocalNotifications.requestPermissions()).display;
      }
      if (allowed !== "granted") {
        return { ok: false, error: "Bạn chưa cho app gửi thông báo." };
      }

      await LocalNotifications.cancel({ notifications: [{ id }] });
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body,
            // `allowWhileIdle` để lời nhắc vẫn nổ khi máy đã ngủ sâu (Doze).
            schedule: { at: new Date(at), allowWhileIdle: true },
            ongoing: false,
          },
        ],
      });
      return { ok: true };
    } catch (cause) {
      return { ok: false, error: (cause as Error).message };
    }
  },

  async cancelNotify(id) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id }] });
      return { ok: true };
    } catch (cause) {
      return { ok: false, error: (cause as Error).message };
    }
  },

  async attachPick() {
    // Dùng luôn bộ chọn file của WebView, không cần thêm plugin nào.
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.onchange = async () => {
        const files = [...(input.files ?? [])];
        if (files.length === 0) return resolve({ ok: false, cancelled: true });

        const saved: Attachment[] = [];
        for (const file of files) {
          const result = await android.attachSave(file.name, await file.arrayBuffer());
          if (result.ok && result.attachment) saved.push(result.attachment);
        }
        resolve({ ok: saved.length > 0, attachments: saved });
      };
      input.click();
    });
  },

  async attachSave(name, bytes) {
    if (bytes.byteLength > MAX_FILE_BYTES) {
      return { ok: false, error: "File lớn hơn 25 MB." };
    }
    try {
      await ensureDir(ATTACHMENTS);
      const file = newFileName(name);
      await Filesystem.writeFile({
        path: `${ATTACHMENTS}/${file}`,
        directory: DIR,
        data: bytesToBase64(bytes),
        recursive: true,
      });
      return {
        ok: true,
        attachment: {
          id: `att-${file}`,
          name,
          file,
          kind: kindOf(name),
          size: bytes.byteLength,
          addedAt: new Date().toISOString(),
        },
      };
    } catch (cause) {
      return { ok: false, error: (cause as Error).message };
    }
  },

  async attachDataUrl(file) {
    const safe = safeName(file);
    if (!safe) return { ok: false, error: "Tên file không hợp lệ." };
    try {
      const result = await Filesystem.readFile({
        path: `${ATTACHMENTS}/${safe}`,
        directory: DIR,
      });
      const mime = MIME[safe.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";
      return { ok: true, dataUrl: `data:${mime};base64,${result.data as string}` };
    } catch (cause) {
      return { ok: false, error: (cause as Error).message };
    }
  },

  async attachOpen(file) {
    const safe = safeName(file);
    if (!safe) return { ok: false, error: "Tên file không hợp lệ." };
    try {
      const { uri } = await Filesystem.getUri({
        path: `${ATTACHMENTS}/${safe}`,
        directory: DIR,
      });
      await Share.share({ url: uri });
      return { ok: true };
    } catch (cause) {
      return { ok: false, error: (cause as Error).message };
    }
  },

  async attachDelete(file) {
    const safe = safeName(file);
    if (!safe) return { ok: false, error: "Tên file không hợp lệ." };
    try {
      await Filesystem.deleteFile({ path: `${ATTACHMENTS}/${safe}`, directory: DIR });
      return { ok: true };
    } catch (cause) {
      return { ok: false, error: (cause as Error).message };
    }
  },
};
