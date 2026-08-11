import { useEffect, useMemo, useState } from "react";

import ItemDetail from "../components/ItemDetail";
import { Bar, Empty, Stars, StatusPill } from "../components/ui";
import { subjectName } from "../lib/catalog";
import { levelLabel, overdueDays, todayISO } from "../lib/srs";
import { dueQueue, freshQueue } from "../lib/stats";
import type { Overview } from "../lib/stats";
import type { SubjectKey } from "../lib/types";
import type { Store } from "../state/useStore";

type Mode = "due" | "fresh";

const SUBJECT_FILTERS: Array<{ key: SubjectKey | "all"; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "riron", label: "理論" },
  { key: "denryoku", label: "電力" },
  { key: "kikai", label: "機械" },
  { key: "houki", label: "法規" },
];

export default function Review({ store, view }: { store: Store; view: Overview }) {
  const data = store.data!;
  const [mode, setMode] = useState<Mode>("due");
  const [subject, setSubject] = useState<SubjectKey | "all">("all");
  // Lọc theo độ khó: tập sao nào đang bật. Rỗng = không lọc.
  const [stars, setStars] = useState<Set<number>>(new Set());
  const [cursor, setCursor] = useState(0);
  const [done, setDone] = useState(0);

  const queue = useMemo(() => {
    const base = mode === "due" ? dueQueue(data) : freshQueue(data);
    return base.filter(
      (item) =>
        (subject === "all" || item.subject === subject) &&
        (stars.size === 0 || stars.has(item.stars)),
    );
  }, [data, mode, subject, stars]);

  // Đổi bộ lọc thì quay về đầu hàng đợi.
  useEffect(() => {
    setCursor(0);
  }, [mode, subject, stars]);

  // Chấm xong một bài thì bài đó rời hàng đợi, con trỏ giữ nguyên vị trí là đã
  // sang bài kế. Chỉ lùi lại khi con trỏ vượt quá cuối danh sách.
  useEffect(() => {
    if (cursor >= queue.length && queue.length > 0) setCursor(queue.length - 1);
  }, [queue.length, cursor]);

  const item = queue[cursor];
  const progress = item ? data.progress[item.id] : undefined;
  const late = item ? overdueDays(progress, todayISO()) : 0;

  const toggleStar = (value: number) => {
    setStars((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const grade = (result: "correct" | "wrong") => {
    if (!item) return;
    store.review(item.id, result);
    setDone((count) => count + 1);
  };

  // Phím tắt: 1 = đúng, 2 = sai, Space = mở bài.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      if (!item) return;

      if (event.key === "1") grade("correct");
      else if (event.key === "2") grade("wrong");
      else if (event.code === "Space") {
        event.preventDefault();
        void window.denken.openExternal(item.url);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="container">
      <div className="card">
        <div className="row between wrap" style={{ gap: 12 }}>
          <div className="chip-row">
            <button
              className={`chip${mode === "due" ? " on" : ""}`}
              onClick={() => setMode("due")}
            >
              🎯 Đến hạn hôm nay ({view.dueToday})
            </button>
            <button
              className={`chip${mode === "fresh" ? " on" : ""}`}
              onClick={() => setMode("fresh")}
            >
              ✨ Bài chưa làm ({view.counts.todo})
            </button>
          </div>
          <div className="small muted nowrap">
            Đã ôn hôm nay: <strong>{view.today.reviewed}</strong>/{view.today.goal}
          </div>
        </div>

        <div className="chip-row" style={{ marginTop: 12 }}>
          {SUBJECT_FILTERS.map((entry) => (
            <button
              key={entry.key}
              className={`chip${subject === entry.key ? " on" : ""}`}
              onClick={() => setSubject(entry.key)}
            >
              <span className={entry.key === "all" ? "" : "ja"}>{entry.label}</span>
            </button>
          ))}
        </div>

        <div className="chip-row" style={{ marginTop: 10 }}>
          <span className="small dim">Độ khó:</span>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              className={`chip${stars.has(value) ? " on" : ""}`}
              onClick={() => toggleStar(value)}
              title={`Chỉ ôn bài ${value} sao`}
            >
              {"★".repeat(value)}
            </button>
          ))}
          {stars.size > 0 && (
            <button className="chip" onClick={() => setStars(new Set())}>
              ✕ Bỏ lọc
            </button>
          )}
        </div>

        {done > 0 && (
          <div className="queue-progress" style={{ marginTop: 14 }}>
            <span className="nowrap">Phiên này: {done} bài</span>
            <Bar
              ratio={view.today.ratio}
              color={view.today.metGoal ? "var(--green)" : "var(--blue)"}
            />
            <span className="nowrap">
              {view.today.metGoal ? "Đạt mục tiêu 🎉" : `còn ${view.today.remaining}`}
            </span>
          </div>
        )}
      </div>

      {!item ? (
        <div className="card">
          {mode === "due" ? (
            <Empty icon="🌤️" title="Không còn bài nào đến hạn">
              <p className="muted">
                {stars.size > 0 || subject !== "all"
                  ? "Không có bài nào khớp bộ lọc. Thử bỏ bớt điều kiện xem sao."
                  : "Bàn học sạch sẽ. Muốn học thêm thì chuyển sang “Bài chưa làm”."}
              </p>
              {view.counts.todo > 0 && (
                <button
                  className="btn primary"
                  style={{ marginTop: 12 }}
                  onClick={() => setMode("fresh")}
                >
                  Học bài mới ({view.counts.todo} bài)
                </button>
              )}
            </Empty>
          ) : (
            <Empty icon="🏆" title="Đã đụng tới toàn bộ giáo trình">
              <p className="muted">
                Không còn bài nào chưa làm khớp bộ lọc. Quay lại ôn theo lịch nhé.
              </p>
            </Empty>
          )}
        </div>
      ) : (
        <>
          <div className="review-card">
            <div className="review-topic">
              <span className="ja" style={{ fontWeight: 700, color: "var(--blue)" }}>
                {subjectName(item.subject)}
              </span>
              <span>·</span>
              <span className="ja">{item.topic}</span>
              <span>·</span>
              <span>
                {item.exam} {item.question}
              </span>
              <Stars count={item.stars} />
              <StatusPill status={progress?.status ?? "todo"} />
              {late > 0 && <span className="pill overdue">Quá hạn {late} ngày</span>}
              <span className="spacer" />
              <span className="small dim nowrap">
                {cursor + 1} / {queue.length}
              </span>
            </div>

            <div className="review-title ja">{item.name}</div>

            <div className="small dim">{levelLabel(progress?.srsLevel ?? 0)}</div>

            <div className="review-actions">
              <button className="btn success" onClick={() => grade("correct")}>
                ✅ Làm đúng <span className="small dim">(1)</span>
              </button>
              <button className="btn danger" onClick={() => grade("wrong")}>
                ❌ Làm sai <span className="small dim">(2)</span>
              </button>
            </div>

            <div className="btn-row" style={{ marginTop: 10 }}>
              <button
                className="btn ghost sm"
                onClick={() => setCursor((index) => Math.max(0, index - 1))}
                disabled={cursor === 0}
              >
                ← Bài trước
              </button>
              <button
                className="btn ghost sm"
                onClick={() =>
                  setCursor((index) => Math.min(queue.length - 1, index + 1))
                }
                disabled={cursor >= queue.length - 1}
              >
                Bỏ qua, bài sau →
              </button>
              <span className="spacer" />
              <button className="btn ghost sm" onClick={() => store.snooze(item.id, 1)}>
                😴 Hoãn 1 ngày
              </button>
              <button className="btn ghost sm" onClick={() => store.snooze(item.id, 7)}>
                Hoãn 1 tuần
              </button>
            </div>
          </div>

          <div className="card">
            <ItemDetail
              item={item}
              progress={progress}
              compact
              onNote={(text) => store.setNote(item.id, text)}
              onRefLink={(url) => store.setRefLink(item.id, url)}
            />
          </div>

          <div className="callout">
            <strong>Phím tắt:</strong> <span className="mono">1</span> làm đúng ·{" "}
            <span className="mono">2</span> làm sai ·{" "}
            <span className="mono">Space</span> mở bài trên trình duyệt.
          </div>
        </>
      )}
    </div>
  );
}
