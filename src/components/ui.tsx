/** Các mảnh giao diện nhỏ dùng lại ở nhiều màn hình. */

import type { ReactNode } from "react";
import { Check, CircleDashed, RotateCcw, Star, X } from "lucide-react";

import { Ic, type IconType } from "./ui/icon";
import { fromISO } from "../lib/srs";
import type { ItemStatus } from "../lib/types";
import { platform } from "../platform";

import { t, t2 } from "../lib/chu";
/* ------------------------------------------------------------------ */
/* Nhãn trạng thái                                                     */
/* ------------------------------------------------------------------ */

export const STATUS_TEXT: Record<ItemStatus, string> = {
  correct: "Đúng",
  relearned: "Sai → Đúng",
  wrong: "Sai",
  todo: "Chưa làm",
};

export const STATUS_ICON: Record<ItemStatus, IconType> = {
  correct: Check,
  relearned: RotateCcw,
  wrong: X,
  todo: CircleDashed,
};

/* Bộ màu hệ thống của macOS — trầm hơn bản cũ, không tranh với màu nhấn. */
export const STATUS_COLOR: Record<ItemStatus, string> = {
  correct: "#32d74b",
  relearned: "#0a84ff",
  wrong: "#ff453a",
  todo: "#3a3a3c",
};

export function StatusPill({ status }: { status: ItemStatus }) {
  return (
    <span className={`pill ${status}`}>
      <Ic i={STATUS_ICON[status]} className="h-3 w-3" strokeWidth={2.5} />
      {t(STATUS_TEXT[status])}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Sao độ khó                                                          */
/* ------------------------------------------------------------------ */

/**
 * Độ khó ★1–5. Sao đặc là mức đã đạt, sao rỗng là phần còn lại — vẽ bằng cùng
 * một icon, chỉ khác chỗ có tô nền hay không, nên hai hàng luôn thẳng nhau.
 */
export function Stars({ count, title }: { count: number; title?: string }) {
  return (
    <span className="stars" title={title ?? t2("Độ khó {n}/5", { n: count })}>
      {[1, 2, 3, 4, 5].map((level) => (
        <Star
          key={level}
          className={`h-3 w-3 shrink-0${level > count ? " off" : ""}`}
          strokeWidth={level > count ? 1.75 : 0}
          fill={level > count ? "none" : "currentColor"}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Vòng tròn tiến độ                                                   */
/* ------------------------------------------------------------------ */

export function Ring({
  ratio,
  size = 116,
  width = 11,
  color = "var(--blue)",
  children,
}: {
  ratio: number;
  size?: number;
  width?: number;
  color?: string;
  children?: ReactNode;
}) {
  const radius = (size - width) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.max(0, Math.min(1, ratio)) * circumference;

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Xoay -90° để vạch bắt đầu từ đỉnh vòng tròn */}
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--surface-2)"
            strokeWidth={width}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={width}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
            style={{ transition: "stroke-dasharray 0.45s ease" }}
          />
        </g>
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Thanh tiến độ                                                       */
/* ------------------------------------------------------------------ */

export function Bar({
  ratio,
  color = "var(--blue)",
  thin,
}: {
  ratio: number;
  color?: string;
  thin?: boolean;
}) {
  return (
    <div className={`bar${thin ? " thin" : ""}`}>
      <div
        className="bar-fill"
        style={{
          width: `${Math.max(0, Math.min(1, ratio)) * 100}%`,
          background: color,
        }}
      />
    </div>
  );
}

/** Thanh xếp chồng bốn trạng thái, tổng luôn bằng chiều rộng. */
export function StatusStack({
  counts,
}: {
  counts: Record<ItemStatus, number>;
}) {
  const total =
    counts.correct + counts.relearned + counts.wrong + counts.todo || 1;
  const order: ItemStatus[] = ["correct", "relearned", "wrong", "todo"];

  return (
    <div className="stack">
      {order.map((status) => (
        <span
          key={status}
          style={{
            width: `${(counts[status] / total) * 100}%`,
            background: STATUS_COLOR[status],
          }}
          title={t2("{trang}: {n}", { trang: t(STATUS_TEXT[status]), n: counts[status] })}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lịch nhiệt kiểu GitHub                                              */
/* ------------------------------------------------------------------ */

/** Đậm dần theo số bài đã ôn so với mục tiêu ngày. */
function heatColor(reviewed: number, goal: number): string {
  if (reviewed === 0) return "var(--surface-2)";
  const level = Math.min(1, reviewed / Math.max(1, goal));
  if (level >= 1) return "#2d88ff";
  if (level >= 0.66) return "#2569c4";
  if (level >= 0.33) return "#1d4d8c";
  return "#193b63";
}

export function Heatmap({
  days,
  goal,
}: {
  days: Array<{ date: string; reviewed: number }>;
  goal: number;
}) {
  // Xếp theo cột tuần, mỗi cột 7 ô từ thứ Hai đến Chủ nhật.
  const columns: Array<Array<{ date: string; reviewed: number } | null>> = [];
  let column: Array<{ date: string; reviewed: number } | null> = [];

  const first = days[0];
  if (first) {
    // Ô trống đầu tuần để ngày đầu tiên rơi đúng thứ của nó.
    const weekday = (fromISO(first.date).getDay() + 6) % 7;
    for (let i = 0; i < weekday; i += 1) column.push(null);
  }

  for (const day of days) {
    column.push(day);
    if (column.length === 7) {
      columns.push(column);
      column = [];
    }
  }
  if (column.length > 0) columns.push(column);

  return (
    <div className="heatmap">
      {columns.map((week, index) => (
        <div className="heatmap-col" key={index}>
          {week.map((day, slot) =>
            day ? (
              <div
                key={day.date}
                className="heat-cell"
                style={{ background: heatColor(day.reviewed, goal) }}
                title={t2("{ngay}: {n} bài", { ngay: day.date, n: day.reviewed })}
              />
            ) : (
              <div
                key={`gap-${slot}`}
                className="heat-cell"
                style={{ background: "transparent" }}
              />
            ),
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Biểu đồ cột                                                         */
/* ------------------------------------------------------------------ */

export function BarChart({
  data,
  height = 130,
}: {
  data: Array<{ label: string; correct: number; wrong: number }>;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((point) => point.correct + point.wrong));

  return (
    <div>
      <div className="chart-bars" style={{ height }}>
        {data.map((point, index) => {
          const total = point.correct + point.wrong;
          return (
            <div
              className="chart-bar"
              key={index}
              title={t2("{nhan} — đúng {dung}, sai {sai}", { nhan: point.label, dung: point.correct, sai: point.wrong })}
            >
              <div
                className="chart-bar-fill"
                style={{
                  height: `${(point.wrong / max) * 100}%`,
                  background: "var(--red)",
                }}
              />
              <div
                className="chart-bar-fill"
                style={{
                  height: `${(point.correct / max) * 100}%`,
                  background: "var(--blue)",
                  borderRadius: total === point.correct ? "3px 3px 0 0" : 0,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="chart-axis">
        {data.map((point, index) => (
          <span key={index}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Liên kết ra ngoài                                                   */
/* ------------------------------------------------------------------ */

/** Mọi link đều mở bằng trình duyệt mặc định, không mở trong app. */
export function openLink(url: string): void {
  if (!url) return;
  void platform.openExternal(url);
}

export function ExternalLink({
  url,
  children,
  className,
}: {
  url: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={className ?? "link"}
      role="link"
      tabIndex={0}
      onClick={() => openLink(url)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") openLink(url);
      }}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Trạng thái rỗng                                                     */
/* ------------------------------------------------------------------ */

export function Empty({
  icon: Icon,
  title,
  children,
}: {
  icon: IconType;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon className="h-8 w-8" strokeWidth={1.25} />
      </div>
      <div className="empty-title">{title}</div>
      {children}
    </div>
  );
}
