/** Các mảnh giao diện nhỏ dùng lại ở nhiều màn hình. */

import type { ReactNode } from "react";

import { fromISO } from "../lib/srs";
import type { ItemStatus } from "../lib/types";
import { platform } from "../platform";

/* ------------------------------------------------------------------ */
/* Nhãn trạng thái                                                     */
/* ------------------------------------------------------------------ */

export const STATUS_TEXT: Record<ItemStatus, string> = {
  correct: "Đúng",
  relearned: "Sai → Đúng",
  wrong: "Sai",
  todo: "Chưa làm",
};

export const STATUS_ICON: Record<ItemStatus, string> = {
  correct: "✅",
  relearned: "🔄",
  wrong: "❌",
  todo: "⬜",
};

export const STATUS_COLOR: Record<ItemStatus, string> = {
  correct: "#31a24c",
  relearned: "#2d88ff",
  wrong: "#f02849",
  todo: "#4e4f50",
};

export function StatusPill({ status }: { status: ItemStatus }) {
  return (
    <span className={`pill ${status}`}>
      {STATUS_ICON[status]} {STATUS_TEXT[status]}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Sao độ khó                                                          */
/* ------------------------------------------------------------------ */

export function Stars({ count, title }: { count: number; title?: string }) {
  return (
    <span className="stars" title={title ?? `Độ khó ${count}/5`}>
      {"★".repeat(count)}
      <span className="off">{"★".repeat(Math.max(0, 5 - count))}</span>
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
          title={`${STATUS_TEXT[status]}: ${counts[status]}`}
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
                title={`${day.date}: ${day.reviewed} bài`}
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
              title={`${point.label} — đúng ${point.correct}, sai ${point.wrong}`}
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
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {children}
    </div>
  );
}
