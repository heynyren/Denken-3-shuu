/**
 * Bộ thành phần nhỏ dùng chung, viết theo lối shadcn/ui.
 *
 * Biến thể khai báo bằng `class-variance-authority` thay vì rải `if` trong JSX:
 * mọi kiểu dáng của một thành phần nằm gọn một chỗ, thêm biến thể mới không phải
 * đi dò lại chỗ gọi.
 */

import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "../../lib/cn";

/* ------------------------------------------------------------------ */
/* Nút                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Bản mô tả Raycast nói "đừng dùng nút bấm, mọi thao tác đi bằng bàn phím" —
 * đúng với một cửa sổ lệnh, sai với app này: trên điện thoại chỉ có ngón tay.
 * Nên giữ nút, nhưng theo đúng tinh thần còn lại: viền mảnh, nền chìm, chỉ một
 * nút mỗi màn được mang màu nhấn.
 */
const buttonStyles = cva(
  "dx-btn inline-flex items-center justify-center gap-2 rounded-row font-medium " +
    "transition-colors duration-100 select-none " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
    "disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      tone: {
        // Đúng một nút chính mỗi màn. Nhiều hơn là không còn cái nào chính.
        accent: "bg-accent text-white hover:bg-accent-dim",
        plain: "bg-hover text-ink hover:bg-[#48484a]",
        quiet: "text-ink-2 hover:bg-hover hover:text-ink",
        outline:
          "text-ink-2 ring-[0.5px] ring-hairline-strong hover:bg-hover hover:text-ink",
      },
      size: {
        // Cao 44px: mốc chạm tối thiểu cho ngón tay, giữ nguyên cả trên máy tính.
        md: "h-11 px-4 text-body",
        sm: "h-8 px-3 text-small",
      },
    },
    defaultVariants: { tone: "plain", size: "md" },
  },
);

export function Button({
  className,
  tone,
  size,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>) {
  return <button className={cn(buttonStyles({ tone, size }), className)} {...rest} />;
}

/* ------------------------------------------------------------------ */
/* Nhãn trạng thái                                                     */
/* ------------------------------------------------------------------ */

const badgeStyles = cva(
  "inline-flex items-center gap-1.5 rounded-hair px-2 py-0.5 text-micro font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-hover text-ink-2",
        accent: "bg-accent-soft text-accent",
        good: "bg-good-soft text-good",
        warn: "bg-warn-soft text-warn",
        bad: "bg-bad-soft text-bad",
        info: "bg-info-soft text-info",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({
  className,
  tone,
  children,
}: { className?: string; children: ReactNode } & VariantProps<typeof badgeStyles>) {
  return <span className={cn(badgeStyles({ tone }), className)}>{children}</span>;
}

/* ------------------------------------------------------------------ */
/* Thanh tiến độ                                                       */
/* ------------------------------------------------------------------ */

/**
 * Mỏng 3px, bo tròn hai đầu. Cố ý không có hiệu ứng chạy hay chuyển màu — bản
 * mô tả cấm trang trí, và thanh này xuất hiện bốn lần liền nhau ở phần tiến độ
 * từng môn, có hiệu ứng là thành rối mắt.
 */
export function Meter({
  value,
  tone = "accent",
  className,
}: {
  /** 0..1 */
  value: number;
  tone?: "accent" | "good" | "info";
  className?: string;
}) {
  const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const fill = { accent: "bg-accent", good: "bg-good", info: "bg-info" }[tone];
  return (
    <div
      className={cn("h-[3px] w-full overflow-hidden rounded-full bg-hover", className)}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={cn("h-full rounded-full", fill)} style={{ width: `${percent}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Vòng tròn tiến độ                                                   */
/* ------------------------------------------------------------------ */

/**
 * Bản cũ có `.ring` trong styles.css, nên thành phần này cố ý mang tên khác và
 * không dùng lớp `ring` của Tailwind — hai cái đó trùng tên, dễ đá nhau.
 */
export function Dial({
  value,
  size = 92,
  width = 5,
  tone = "var(--color-accent)",
  children,
}: {
  /** 0..1 */
  value: number;
  size?: number;
  width?: number;
  tone?: string;
  children?: ReactNode;
}) {
  const radius = (size - width) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.max(0, Math.min(1, value)) * circumference;

  return (
    <div
      className="dx-grid relative shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute inset-0">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-hover)"
            strokeWidth={width}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={tone}
            strokeWidth={width}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference - filled}`}
          />
        </g>
      </svg>
      <div className="relative text-center leading-none">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hàng danh sách                                                      */
/* ------------------------------------------------------------------ */

/**
 * Hàng cao 44px, bo 8px, đổi nền khi rê chuột trong 80ms — đúng đặc tả
 * `.result-row` của bản mô tả. Đây là nhịp thị giác chính của cả phong cách này.
 */
export function Row({
  onClick,
  className,
  children,
  ...rest
}: {
  onClick?: () => void;
  className?: string;
  children: ReactNode;
  /** Cho phép gắn `data-*` — kiểm thử bám vào đó thay vì bám tên lớp CSS. */
  [key: `data-${string}`]: string | undefined;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      {...rest}
      onClick={onClick}
      className={cn(
        "dx-btn flex w-full min-h-11 items-center gap-3 rounded-row px-3 text-left",
        "transition-colors duration-[80ms]",
        onClick && "cursor-pointer hover:bg-hover",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Phím tắt hiện thành viên gạch nhỏ. */
export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="dx-kbd">{children}</kbd>;
}
