import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { primeAudio } from "./lib/alarm";
// Thứ tự nạp có ý nghĩa: theme.css xếp Tailwind vào tầng riêng, còn styles.css
// để ngoài tầng nên luôn thắng khi trùng tên lớp. Đảo lại là vỡ bốn màn cũ.
import "./design/theme.css";
import "./styles.css";

const container = document.getElementById("root");
if (!container) throw new Error("Không tìm thấy #root");

/**
 * Mở khoá tiếng ngay thao tác đầu tiên của người dùng.
 *
 * Chuông báo hết giờ do đồng hồ gọi, mà lúc đó không có thao tác nào của người
 * dùng để trình duyệt lấy cớ cho phát tiếng — nên phải xin quyền từ trước.
 * Không dùng `{ once: true }`: Android treo AudioContext mỗi lần app xuống nền,
 * cứ chạm lại là đánh thức lại.
 */
for (const event of ["pointerdown", "keydown", "touchstart"]) {
  window.addEventListener(event, primeAudio, { passive: true });
}
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) primeAudio();
});

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
