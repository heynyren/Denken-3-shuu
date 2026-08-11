/** Hộp giới thiệu tác giả, mở từ nút nhỏ ở cuối thanh bên. */

import { useEffect } from "react";

import { ExternalLink } from "./ui";

/** Cờ Việt Nam: nền đỏ, ngôi sao vàng năm cánh ở giữa. */
export function VietnamFlag({ size = 20 }: { size?: number }) {
  // Ngôi sao năm cánh: bán kính ngoài 4.4, bán kính trong 0.382 lần bán kính ngoài.
  const star =
    "M15,5.6 L16,8.64 L19.18,8.64 L16.6,10.52 L17.59,13.56 " +
    "L15,11.68 L12.41,13.56 L13.4,10.52 L10.82,8.64 L14,8.64 Z";

  return (
    <svg
      width={size * 1.5}
      height={size}
      viewBox="0 0 30 20"
      aria-label="Cờ Việt Nam"
      style={{ borderRadius: 3, flexShrink: 0 }}
    >
      <rect width="30" height="20" fill="#DA251D" />
      <path d={star} fill="#FFFF00" />
    </svg>
  );
}

export default function About({ onClose }: { onClose(): void }) {
  // Bấm Esc là đóng, cho quen tay.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <VietnamFlag size={30} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div id="about-title" className="modal-title">
              Nyren Phạm
            </div>
            <div className="small dim">Ninh Bình, Việt Nam</div>
          </div>
          <button className="icon-btn" onClick={onClose} title="Đóng (Esc)">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p>
            Cựu sinh viên khoa <strong>Tự động hoá, Đại học Bách Khoa Hà Nội</strong>.
          </p>
          <p>
            Mình đã dành cả thanh xuân để học tiếng Nhật và{" "}
            <span className="ja">電験三種</span>. Vì thế mình tạo ra công cụ này với
            mục đích giúp các bạn có thể ôn tập cho kỳ thi{" "}
            <span className="ja">電験三種</span> một cách khoa học và đỡ vất vả.
          </p>
          <p>
            Nguồn dữ liệu được lấy từ các đường link của trang web{" "}
            <ExternalLink url="https://denken-ou.com/">電験王 (Denken-ou)</ExternalLink>
            .
          </p>
          <p className="muted">Xin cảm ơn mọi người đã đọc.</p>
        </div>

        <div className="modal-foot">
          <span className="spacer" />
          <button className="btn primary sm" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
