/**
 * Nhân bản dữ liệu ra một thư mục thứ hai, và xuất gói .zip đầy đủ.
 *
 * Bản sao lưu hằng ngày trong `backups/` nằm cùng ổ đĩa với bản gốc, nên nó
 * chống được thao tác sai nhưng vô dụng khi ổ cứng hỏng, mất máy, hoặc dính mã
 * độc tống tiền. Bản sao phải nằm ngoài máy tính mới cứu được ba tình huống đó.
 *
 * Cách rẻ và chắc nhất là chép thêm một bản vào thư mục mà ứng dụng Google Drive
 * hay OneDrive đang đồng bộ. App chỉ ghi file, không cần tài khoản hay khoá API,
 * và không phụ thuộc vào dịch vụ nào trong code.
 */

import archiver from "archiver";
import { createWriteStream, promises as fs } from "node:fs";
import path from "node:path";

import { attachmentsDir } from "./attachments";
import { paths } from "./store";

export interface MirrorReport {
  dataCopied: boolean;
  filesCopied: number;
  bytesCopied: number;
}

/**
 * Chép data.json và những file đính kèm chưa có sang thư mục nhân bản.
 *
 * File đính kèm không bao giờ đổi nội dung sau khi tạo (tên là uuid), nên chỉ
 * cần chép file nào bên kia chưa có. Nhờ vậy mỗi lần ghi chỉ tốn đúng vài trăm
 * KB của data.json thay vì chép lại cả thư mục ảnh.
 */
export async function mirrorTo(target: string): Promise<MirrorReport> {
  const report: MirrorReport = { dataCopied: false, filesCopied: 0, bytesCopied: 0 };
  await fs.mkdir(target, { recursive: true });

  // Ghi nguyên tử ở cả bản nhân bản: thư mục đám mây có thể đọc file bất cứ lúc
  // nào để đẩy lên, không được để nó bắt gặp file ghi dở.
  const tmp = path.join(target, "data.json.tmp");
  await fs.copyFile(paths.file, tmp);
  await fs.rename(tmp, path.join(target, "data.json"));
  report.dataCopied = true;

  const sourceDir = attachmentsDir();
  let names: string[];
  try {
    names = await fs.readdir(sourceDir);
  } catch {
    return report; // chưa có file đính kèm nào
  }

  const mirrorAttachments = path.join(target, "attachments");
  await fs.mkdir(mirrorAttachments, { recursive: true });

  for (const name of names) {
    const to = path.join(mirrorAttachments, name);
    try {
      await fs.access(to);
      continue; // đã có bên kia rồi
    } catch {
      // chưa có, chép sang
    }
    try {
      const from = path.join(sourceDir, name);
      await fs.copyFile(from, to);
      report.filesCopied += 1;
      report.bytesCopied += (await fs.stat(to)).size;
    } catch {
      // Một file hỏng không được làm hỏng cả lượt nhân bản.
    }
  }
  return report;
}

/**
 * Gói toàn bộ thư mục dữ liệu thành một file .zip.
 *
 * Khác với "Xuất bản sao lưu (JSON)": file JSON chỉ có phần mô tả file đính kèm
 * chứ không có nội dung ảnh, nên khôi phục từ JSON là mất ảnh. Gói .zip này có
 * đủ cả hai, dùng khi chuyển sang máy khác.
 */
export async function exportZip(target: string): Promise<{ bytes: number }> {
  await fs.mkdir(path.dirname(target), { recursive: true });

  return new Promise((resolve, reject) => {
    const out = createWriteStream(target);
    const zip = archiver("zip", { zlib: { level: 9 } });

    out.on("close", () => resolve({ bytes: zip.pointer() }));
    out.on("error", reject);
    zip.on("error", reject);
    // Thiếu thư mục attachments/ chỉ là cảnh báo, không phải lỗi.
    zip.on("warning", (error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") reject(error);
    });

    zip.pipe(out);
    zip.file(paths.file, { name: "data.json" });
    zip.directory(attachmentsDir(), "attachments");
    zip.directory(paths.backupDir, "backups");
    void zip.finalize();
  });
}
