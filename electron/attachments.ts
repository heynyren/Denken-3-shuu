/**
 * File đính kèm ghi chú.
 *
 * Nội dung file nằm ở `<thư mục dữ liệu>/attachments/`, chỉ phần mô tả
 * (tên, loại, kích thước) mới nằm trong data.json. Nếu nhồi cả file vào JSON
 * thì mỗi lần gõ một chữ trong ghi chú sẽ phải ghi lại vài chục MB xuống đĩa.
 *
 * Đây là chỗ giao diện chạm tới ổ đĩa gần nhất, nên mọi tên file từ giao diện
 * gửi xuống đều phải đi qua `resolveSafe()` trước khi dùng.
 */

import { app, shell } from "electron";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import type { Attachment, AttachmentKind } from "../src/lib/types";

/** Trần 25 MB mỗi file: đủ cho ảnh chụp màn hình và đề PDF, không phình thư mục dữ liệu. */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".avif"]);
const DOC_EXT: Record<string, AttachmentKind> = {
  ".pdf": "pdf",
  ".docx": "docx",
  ".doc": "docx",
};

/** Loại file quyết định cách hiển thị: ảnh thì xem ngay, còn lại thì mở bằng app ngoài. */
export function kindOf(fileName: string): AttachmentKind {
  const ext = path.extname(fileName).toLowerCase();
  if (IMAGE_EXT.has(ext)) return "image";
  return DOC_EXT[ext] ?? "other";
}

function dir(): string {
  return path.join(app.getPath("userData"), "attachments");
}

/**
 * Đổi tên file do giao diện gửi xuống thành đường dẫn thật, có kiểm tra.
 *
 * Giao diện chỉ được phép nhắc tới file bằng tên trơn. Nếu nó gửi xuống
 * "../../data.json" hay một đường dẫn tuyệt đối thì phải chặn ngay, nếu không
 * một lỗi ở giao diện có thể xoá mất file dữ liệu.
 */
function resolveSafe(fileName: string): string {
  if (!fileName || fileName !== path.basename(fileName)) {
    throw new Error("Tên file không hợp lệ.");
  }
  const full = path.join(dir(), fileName);
  const parent = path.resolve(dir());
  if (!path.resolve(full).startsWith(parent + path.sep)) {
    throw new Error("Tên file nằm ngoài thư mục đính kèm.");
  }
  return full;
}

/** Tên lưu trên đĩa: ngẫu nhiên để không bao giờ đụng tên, giữ lại phần mở rộng. */
function storageName(original: string): string {
  const ext = path.extname(original).toLowerCase().slice(0, 12);
  return `${randomUUID()}${ext}`;
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(dir(), { recursive: true });
}

function describe(original: string, stored: string, size: number): Attachment {
  return {
    id: randomUUID(),
    name: original,
    file: stored,
    kind: kindOf(original),
    size,
    addedAt: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ */

/** Chép một file có sẵn trên máy vào thư mục đính kèm. */
export async function copyIn(sourcePath: string): Promise<Attachment> {
  const stat = await fs.stat(sourcePath);
  if (stat.size > MAX_FILE_BYTES) {
    throw new Error(
      `${path.basename(sourcePath)} nặng ${Math.round(stat.size / 1024 / 1024)} MB, ` +
        `vượt giới hạn ${MAX_FILE_BYTES / 1024 / 1024} MB.`,
    );
  }
  await ensureDir();
  const original = path.basename(sourcePath);
  const stored = storageName(original);
  await fs.copyFile(sourcePath, path.join(dir(), stored));
  return describe(original, stored, stat.size);
}

/** Ghi thẳng từ bộ nhớ — dùng cho ảnh dán từ clipboard. */
export async function writeBytes(
  original: string,
  bytes: Uint8Array,
): Promise<Attachment> {
  if (bytes.byteLength > MAX_FILE_BYTES) {
    throw new Error(
      `File nặng ${Math.round(bytes.byteLength / 1024 / 1024)} MB, ` +
        `vượt giới hạn ${MAX_FILE_BYTES / 1024 / 1024} MB.`,
    );
  }
  await ensureDir();
  const stored = storageName(original);
  await fs.writeFile(path.join(dir(), stored), bytes);
  return describe(original, stored, bytes.byteLength);
}

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".avif": "image/avif",
};

/** Đọc ảnh thành data URL để hiện ngay trong app. */
export async function dataUrl(fileName: string): Promise<string> {
  const full = resolveSafe(fileName);
  const ext = path.extname(fileName).toLowerCase();
  const mime = MIME[ext];
  if (!mime) throw new Error("Chỉ xem trước được file ảnh.");
  const bytes = await fs.readFile(full);
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

/** Mở file bằng ứng dụng mặc định (Word cho docx, trình đọc PDF…). */
export async function openWithSystem(fileName: string): Promise<void> {
  const full = resolveSafe(fileName);
  await fs.access(full); // báo lỗi rõ ràng nếu file đã bị xoá tay
  const message = await shell.openPath(full);
  if (message) throw new Error(message);
}

export async function remove(fileName: string): Promise<void> {
  await fs.rm(resolveSafe(fileName), { force: true });
}

/**
 * Xoá những file không còn ghi chú nào nhắc tới.
 *
 * Xoá một ghi chú chỉ bỏ phần mô tả trong data.json, file vẫn nằm lại trên đĩa.
 * Hàm này chạy lúc khởi động để thư mục đính kèm không phình mãi.
 */
export async function pruneOrphans(inUse: Set<string>): Promise<number> {
  let names: string[];
  try {
    names = await fs.readdir(dir());
  } catch {
    return 0;
  }
  const orphans = names.filter((name) => !inUse.has(name));
  await Promise.all(
    orphans.map((name) => fs.rm(path.join(dir(), name), { force: true })),
  );
  return orphans.length;
}

export async function totalBytes(): Promise<number> {
  let names: string[];
  try {
    names = await fs.readdir(dir());
  } catch {
    return 0;
  }
  const sizes = await Promise.all(
    names.map(async (name) => {
      try {
        return (await fs.stat(path.join(dir(), name))).size;
      } catch {
        return 0;
      }
    }),
  );
  return sizes.reduce((sum, size) => sum + size, 0);
}

export const attachmentsDir = dir;
