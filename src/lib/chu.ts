/**
 * NGÔN NGỮ GIAO DIỆN — tiếng Việt / tiếng Anh / tiếng Nhật
 * ========================================================
 *
 * App này viết bằng tiếng Việt, và tiếng Việt vẫn là bản GỐC: mọi chuỗi trên
 * màn hình nằm thẳng trong mã như cũ, không đổi thành khoá kiểu `nav.today`.
 *
 * Vì sao không dùng khoá: khoá làm mã khó đọc (`t("nav.today")` không cho biết
 * nó hiện ra chữ gì) và tạo thêm một thứ phải giữ đồng bộ — đổi chữ tiếng Việt
 * mà quên đổi khoá thì im lặng hỏng. Ở đây từ điển được tra bằng CHÍNH CÂU
 * TIẾNG VIỆT, nên:
 *
 *   - đọc mã vẫn thấy đúng chữ sẽ hiện ra;
 *   - thiếu bản dịch thì rơi về tiếng Việt, chứ không hiện ra một cái khoá trần;
 *   - xoá một câu khỏi mã là dòng từ điển của nó thành thừa, chứ không thành lỗi.
 *
 * Đổi lại: sửa một chữ tiếng Việt thì phải sửa cả dòng khoá trong `chu-bang.ts`.
 * Đó là cái giá đã cân nhắc — bù lại không bao giờ có màn hình hiện khoá trần.
 */

import { CHU_BANG } from "./chu-bang";

export type Ngon = "vi" | "en" | "ja";

export const NGON_DS: Ngon[] = ["vi", "en", "ja"];

/** Tên từng thứ tiếng, viết bằng chính thứ tiếng đó. */
export const NGON_TEN: Record<Ngon, string> = {
  vi: "Tiếng Việt",
  en: "English",
  ja: "日本語",
};

export function hopLe(x: unknown): Ngon {
  return x === "en" || x === "ja" ? x : "vi";
}

/*
 * Thứ tiếng đang dùng chỉ là một biến của module chứ không phải state của
 * React. Lý do: `t()` được gọi ở hàng trăm chỗ, kể cả ngoài component (bảng
 * huy hiệu, tên môn…), mà một hook thì chỉ gọi được trong component.
 *
 * Để React vẽ lại khi đổi tiếng, `App` đặt biến này NGAY TRONG lượt vẽ, trước
 * khi các màn con vẽ — xem `datNgon()` được gọi ở đầu `App()`. Cài đặt nằm
 * trong dữ liệu đã đồng bộ, nên đổi cài đặt là cả cây vẽ lại sẵn rồi.
 */
let dangDung: Ngon = "vi";

export function datNgon(x: unknown): Ngon {
  dangDung = hopLe(x);
  if (typeof document !== "undefined") document.documentElement.lang = dangDung;
  return dangDung;
}

export function ngon(): Ngon {
  return dangDung;
}

/**
 * Câu tiếng Việt -> câu trong thứ tiếng đang dùng.
 * Không có bản dịch thì trả lại nguyên câu tiếng Việt — thà đọc được tiếng Việt
 * còn hơn nhìn một ô trống.
 */
export function t(vi: string): string {
  if (dangDung === "vi") return vi;
  const bang = CHU_BANG[dangDung];
  const ra = bang && bang[vi];
  return ra || vi;
}

/**
 * Như `t()` nhưng có chỗ trống để điền: `t2("Còn {n} bài", { n: 3 })`.
 *
 * Vì sao không ghép chuỗi ở chỗ gọi: trật tự các mảnh trong câu mỗi thứ tiếng
 * một khác. "Còn 3 bài" sang tiếng Nhật là "あと 3 件" — số nằm giữa. Ghép tay
 * thì bản dịch không có đường nào đổi được trật tự đó.
 */
export function t2(vi: string, thay: Record<string, string | number>): string {
  let ra = t(vi);
  for (const k of Object.keys(thay)) ra = ra.split("{" + k + "}").join(String(thay[k]));
  return ra;
}
