/**
 * Đề thi PDF: biết kỳ nào có đề, và tên file của nó.
 *
 * Vì sao cần
 * ----------
 * Lúc thi thử, nút `↗` mở trang denken-ou.com của câu đó. Trang ấy có sẵn cả
 * lời giải — mở ra giữa lúc đang thi là tự phá buổi thi của mình. Có đề PDF gốc
 * thì nên mở đề, không mở trang giải.
 *
 * Nên: kỳ nào có đề PDF thì nút mở đề PDF, kỳ nào chưa có mới lùi về link
 * denken-ou. Không có đề thì thà cho link còn hơn không cho gì.
 *
 * Tên file suy ra, không gõ tay
 * -----------------------------
 * Một đề PDF ứng với một cặp (kỳ thi, môn) — cả 18 câu của 理論 R08上 nằm trong
 * cùng một file. Tên file đặt theo đúng mã mà denken-ou dùng cho slug:
 *
 *     理論 令和8年度上期  ->  rironr8-1.pdf
 *     機械 平成22年度     ->  kikaih22.pdf
 *
 * Mã kỳ (`r8-1`, `h22`) **không viết thành bảng tay** mà đọc ra từ chính link
 * của các bài trong danh mục. Thêm kỳ mới là mã tự có, không phải sửa thêm chỗ
 * nào — đúng một nguồn sự thật, không có hai bảng để lệch nhau.
 */

import { items } from "./catalog";
import type { CatalogItem, SubjectKey } from "./types";

/**
 * Mã kỳ thi theo cách đặt của denken-ou, đọc ra từ link trong danh mục.
 *
 * Lấy theo số nhiều: trong danh mục có đúng một bài mang link sai môn
 * (法規 R4下 問11 trỏ sang trang 電力), nếu tin bài lẻ đó thì cả kỳ mang mã sai.
 */
const maKy: Map<string, string> = (() => {
  const dem = new Map<string, Map<string, number>>();

  for (const bai of items) {
    const slug = /denken-ou\.com\/([^/]+)/.exec(bai.url)?.[1];
    if (!slug) continue;
    // Bỏ số câu ở cuối: `rironr8-1-13` -> `rironr8-1`.
    const goc = slug.replace(/-\d+$/, "");
    // Chỉ tin link nào đúng môn của bài.
    if (!goc.startsWith(bai.subject)) continue;

    const ma = goc.slice(bai.subject.length);
    if (!ma) continue;
    const theoKy = dem.get(bai.exam) ?? new Map<string, number>();
    theoKy.set(ma, (theoKy.get(ma) ?? 0) + 1);
    dem.set(bai.exam, theoKy);
  }

  const ra = new Map<string, string>();
  for (const [ky, theoKy] of dem) {
    const [hay] = [...theoKy.entries()].sort((a, b) => b[1] - a[1]);
    if (hay) ra.set(ky, hay[0]);
  }
  return ra;
})();

/** Tên file đề PDF của một cặp (kỳ thi, môn). `null` nếu không biết mã kỳ. */
export function tenDeThi(exam: string, subject: SubjectKey): string | null {
  const ma = maKy.get(exam);
  return ma ? `${subject}${ma}.pdf` : null;
}

/** Tên file đề PDF chứa câu này. */
export function tenDeThiCuaBai(bai: CatalogItem): string | null {
  return tenDeThi(bai.exam, bai.subject);
}

/** Chặn tên file lạ. Định nghĩa ở `platform/types.ts`, xuất lại cho gọn chỗ gọi. */
export { tenDeThiAnToan } from "../platform/types";
