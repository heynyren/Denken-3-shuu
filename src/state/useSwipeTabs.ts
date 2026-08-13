/**
 * Vuốt ngang để đổi tab, như mọi app học tập trên điện thoại.
 *
 * Chỗ khó không phải là bắt cử chỉ vuốt, mà là **đừng bắt nhầm**. Trong app có
 * mấy thứ tự cuộn ngang: lịch nhiệt 17 tuần, hàng chip lọc, bảng phân tích. Nếu
 * cứ thấy ngón tay đi ngang là đổi tab thì kéo lịch nhiệt sang trái một cái là
 * văng sang màn khác — bực hơn hẳn so với không có tính năng này.
 *
 * Bốn điều kiện, phải đúng cả bốn thì mới tính là vuốt đổi tab:
 *
 *   1. Đúng một ngón. Hai ngón là đang phóng to thu nhỏ.
 *   2. Điểm chạm không nằm trong thứ gì đang cuộn ngang được — kiểm tra ngược
 *      lên cây DOM từ chỗ chạm.
 *   3. Đi ngang nhiều hơn đi dọc rõ rệt, và vượt một quãng tối thiểu. Không có
 *      điều này thì cuộn dọc hơi chéo tay một chút là đổi tab.
 *   4. Không quá chậm. Rê ngón tay lững thững vài giây rồi thả không phải là
 *      cử chỉ vuốt.
 */

import { useEffect, useRef } from "react";

/** Đi ngang ít nhất bấy nhiêu pixel mới tính. */
const NGUONG = 60;
/** Đi ngang phải gấp bấy nhiêu lần đi dọc. */
const TI_LE = 1.6;
/** Lâu hơn bấy nhiêu mili giây thì coi như đang kéo chứ không phải vuốt. */
const HAN_GIO = 600;

/** Chỗ chạm có nằm trong thứ gì tự cuộn ngang được không. */
function trongVungCuonNgang(target: EventTarget | null): boolean {
  let node = target as HTMLElement | null;
  while (node && node !== document.body) {
    if (node.scrollWidth > node.clientWidth + 4) {
      const kieu = getComputedStyle(node).overflowX;
      if (kieu === "auto" || kieu === "scroll") return true;
    }
    node = node.parentElement;
  }
  return false;
}

export function useSwipeTabs(
  /** Số thứ tự tab đang mở. */
  index: number,
  /** Tổng số tab. */
  count: number,
  /** Đổi sang tab thứ mấy. */
  onChange: (next: number) => void,
): void {
  // Giữ trong ref để hàm bắt sự kiện không phải gắn lại mỗi lần đổi tab.
  const tuoi = useRef({ index, count, onChange });
  tuoi.current = { index, count, onChange };

  useEffect(() => {
    let x0 = 0;
    let y0 = 0;
    let luc = 0;
    let theoDoi = false;

    const batDau = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        theoDoi = false;
        return;
      }
      const cham = event.touches[0]!;
      if (trongVungCuonNgang(event.target)) {
        theoDoi = false;
        return;
      }
      x0 = cham.clientX;
      y0 = cham.clientY;
      luc = Date.now();
      theoDoi = true;
    };

    const ketThuc = (event: TouchEvent) => {
      if (!theoDoi) return;
      theoDoi = false;

      const cham = event.changedTouches[0];
      if (!cham) return;
      const dx = cham.clientX - x0;
      const dy = cham.clientY - y0;

      if (Date.now() - luc > HAN_GIO) return;
      if (Math.abs(dx) < NGUONG) return;
      if (Math.abs(dx) < Math.abs(dy) * TI_LE) return;

      const { index: hienTai, count: tong, onChange: doi } = tuoi.current;
      // Vuốt sang TRÁI nghĩa là kéo màn kế tiếp vào, tức là đi tới.
      const toi = dx < 0 ? hienTai + 1 : hienTai - 1;
      if (toi >= 0 && toi < tong) doi(toi);
    };

    // `passive` để trình duyệt khỏi phải chờ xem ta có chặn cuộn không —
    // ta không chặn bao giờ, và chờ là cuộn bị khựng.
    window.addEventListener("touchstart", batDau, { passive: true });
    window.addEventListener("touchend", ketThuc, { passive: true });
    window.addEventListener("touchcancel", () => (theoDoi = false), { passive: true });
    return () => {
      window.removeEventListener("touchstart", batDau);
      window.removeEventListener("touchend", ketThuc);
    };
  }, []);
}
