/**
 * Chúc mừng khi mở khoá huy hiệu.
 *
 * Huy hiệu chưa đạt thì không hiện ở đâu cả — chạm mốc lúc đang học mới bật
 * popup này lên, rồi huy hiệu mới được ghim vào khu huy hiệu ở màn Hôm nay.
 * Bất ngờ thì mới vui; thấy trước cả danh sách khoá thì hết ý nghĩa.
 */

import { useEffect } from "react";

import { BADGES } from "../lib/badges";

import { t, t2 } from "../lib/chu";
export default function BadgeCelebration({
  earned,
  onClose,
}: {
  earned: string[];
  onClose(): void;
}) {
  const badges = earned
    .map((id) => BADGES.find((badge) => badge.id === id))
    .filter((badge): badge is (typeof BADGES)[number] => Boolean(badge));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (badges.length === 0) return null;

  return (
    <div className="celebrate-backdrop" onClick={onClose}>
      {/* Mảnh giấy rơi — thuần CSS, không kéo thêm thư viện nào */}
      <div className="confetti" aria-hidden="true">
        {Array.from({ length: 28 }, (_, index) => (
          <i
            key={index}
            style={{
              left: `${(index * 3.6) % 100}%`,
              animationDelay: `${(index % 9) * 0.14}s`,
              background: ["#2d88ff", "#f7b928", "#31a24c", "#f02849", "#b57bff"][
                index % 5
              ],
            }}
          />
        ))}
      </div>

      <div
        className="celebrate-card"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="celebrate-kicker">
          {badges.length > 1
            ? t2("Mở khoá {n} huy hiệu!", { n: badges.length })
            : t("Mở khoá huy hiệu!")}
        </div>

        <div className="celebrate-badges">
          {badges.map((badge, index) => (
            <div
              className="celebrate-badge"
              key={badge.id}
              style={{ animationDelay: `${index * 0.16}s` }}
            >
              <div className="celebrate-icon">
                <badge.icon strokeWidth={1.25} />
              </div>
              <div className="celebrate-name">{t(badge.name)}</div>
              <div className="celebrate-desc">{t(badge.description)}</div>
            </div>
          ))}
        </div>

        <button className="btn primary lg" onClick={onClose} autoFocus>
          {t("Tuyệt vời, học tiếp thôi!")}
        </button>
      </div>
    </div>
  );
}
