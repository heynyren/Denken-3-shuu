/**
 * Giữ màn hình sống khi chuyển sang tab khác.
 *
 * Vì sao cần
 * ----------
 * Trước đây App.tsx vẽ theo kiểu `{tab === "review" && <Review/>}`. Đổi tab là
 * React tháo hẳn màn cũ ra khỏi cây, nên mọi thứ nằm trong nó biến mất: bộ lọc
 * vừa chọn, vị trí cuộn, đang xem bài thứ mấy trong hàng đợi.
 *
 * Tệ nhất là màn Thi thử: nó giữ đề đang làm, đáp án đã chọn và đồng hồ đếm
 * ngược trong state. Đang thi mà bấm sang tab khác một cái là mất trắng bài thi
 * — đúng nghĩa mất, không có cách nào lấy lại.
 *
 * Ở đây mỗi màn được **mount một lần rồi ở lại**, chỉ ẩn đi bằng CSS. Trạng
 * thái còn nguyên, quay lại đúng chỗ vừa rời đi.
 *
 * Hai chi tiết đáng nói:
 *
 *   - **Mount lười.** Màn nào chưa mở lần nào thì chưa dựng. Mở app không phải
 *     dựng sẵn cả danh sách 1609 bài lẫn phòng thi trong khi bạn chỉ định xem
 *     trang Hôm nay.
 *   - **Mỗi màn một khung cuộn riêng.** Dùng chung một khung cuộn thì cuộn ở
 *     màn này xong sang màn kia lại thấy nó cuộn theo, mà quay về thì mất chỗ cũ.
 *
 * `hidden` chứ không phải `display:none` đặt tay: thẻ ẩn bằng thuộc tính này
 * cũng bị trình đọc màn hình và phím Tab bỏ qua, chứ không chỉ biến mất trên
 * hình.
 */

import { createContext, useContext, useRef, type ReactNode } from "react";

/**
 * Màn đang bọc quanh chỗ này có đang hiện không.
 *
 * Cần vì màn ẩn vẫn nằm nguyên trong DOM và vẫn chạy code. Màn Ôn tập nghe phím
 * ở cấp `window` (1 = đúng, 2 = sai); nếu nó không biết mình đang bị ẩn thì bấm
 * phím `1` lúc đang ở màn Danh sách bài sẽ **chấm nhầm một bài bên Ôn tập** mà
 * bạn không hề thấy gì.
 *
 * Mặc định `true` để thành phần nào không nằm trong KeepAlive vẫn chạy bình thường.
 */
const DangHien = createContext(true);

/** Màn chứa chỗ này có đang hiện không. Dùng để tắt phím tắt lúc bị ẩn. */
export function usePaneActive(): boolean {
  return useContext(DangHien);
}

export function KeepAlive({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  // Đã từng mở lần nào chưa. Mở rồi thì giữ luôn, không tháo ra nữa.
  const daMo = useRef(active);
  if (active) daMo.current = true;
  if (!daMo.current) return null;

  return (
    <DangHien.Provider value={active}>
      <div className="pane" hidden={!active}>
        {children}
      </div>
    </DangHien.Provider>
  );
}
