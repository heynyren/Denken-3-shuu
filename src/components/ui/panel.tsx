/**
 * Khối nội dung nền tảng, theo lối shadcn/ui: không phải thư viện cài vào mà là
 * code nằm ngay trong dự án, sửa được tuỳ ý.
 *
 * Tạo hình theo bản mô tả Raycast (design-md/raycast/DESIGN.md):
 * nền `--color-raised`, viền nửa pixel, bo 12px, bóng rất nhẹ. Không dùng
 * chuyển màu trang trí — mục 7 của bản mô tả cấm hẳn.
 */

import type { ComponentType, ReactNode } from "react";

import { cn } from "../../lib/cn";

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-panel bg-raised p-4",
        "shadow-[0_1px_2px_rgba(0,0,0,0.5)] ring-[0.5px] ring-hairline",
        className,
      )}
    >
      {children}
    </section>
  );
}

/**
 * Đầu khối: nhãn nhỏ viết hoa ở trên, tiêu đề ở dưới.
 *
 * Bản mô tả yêu cầu nhãn mục là 11px viết hoa và **không in đậm** — đó là thứ
 * làm giao diện trông có tổ chức mà không ồn ào.
 */
export function PanelHead({
  icon: Icon,
  eyebrow,
  title,
  hint,
  right,
}: {
  /** Icon Lucide. Nét mảnh 1.5, cỡ 16 — đủ thấy, không tranh chỗ với tiêu đề. */
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
  eyebrow?: string;
  title?: ReactNode;
  hint?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="mb-3 flex items-start gap-3">
      {Icon && (
        <span className="dx-grid mt-0.5 h-8 w-8 shrink-0 place-items-center rounded-row bg-sunken text-ink-2">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        {eyebrow && <div className="dx-eyebrow">{eyebrow}</div>}
        {title && (
          <h2 className="mt-1 text-lead font-semibold text-ink truncate">{title}</h2>
        )}
        {hint && <p className="mt-0.5 text-small text-ink-3">{hint}</p>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </header>
  );
}
