import {
  CalendarCheck,
  CheckCircle2,
  Star,
  Moon,
  PartyPopper,
  RotateCcw,
  Search,
  Sparkles,
  Target,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import { Ic } from "../components/ui/icon";
import { useEffect, useMemo, useState } from "react";

import ItemDetail from "../components/ItemDetail";
import Timer, { useCountdown } from "../components/Timer";
import { Bar, Empty, Stars, StatusPill } from "../components/ui";
import { subjectName, topicsBySubject } from "../lib/catalog";
import { levelLabel, overdueDays, todayISO } from "../lib/srs";
import { dueQueue, freshQueue, topicQueue, wrongQueue } from "../lib/stats";
import type { Overview } from "../lib/stats";
import type { AppData, CatalogItem, SubjectKey } from "../lib/types";
import type { Store } from "../state/useStore";
import { platform } from "../platform";
import { topicVi } from "../lib/vi";

type Mode = "due" | "wrong" | "fresh" | "topic";

/** Yêu cầu mở thẳng một chủ đề, gửi từ trang Hôm nay hoặc từ bảng phân tích bài thi. */
export interface TopicFocus {
  subject: SubjectKey;
  topic: string;
}

const SUBJECT_FILTERS: Array<{ key: SubjectKey | "all"; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "riron", label: "理論" },
  { key: "denryoku", label: "電力" },
  { key: "kikai", label: "機械" },
  { key: "houki", label: "法規" },
];

/** Dựng danh sách bài cho một bộ lọc. */
function buildQueue(
  data: AppData,
  mode: Mode,
  subject: SubjectKey | "all",
  topic: string,
  stars: Set<number>,
): CatalogItem[] {
  if (mode === "topic") {
    // Ôn lại cả một chủ đề: lấy hết bài của chủ đề, không lọc thêm gì nữa.
    return subject === "all" ? [] : topicQueue(data, subject, topic);
  }

  const base =
    mode === "due"
      ? dueQueue(data)
      : mode === "wrong"
        ? wrongQueue(data)
        : freshQueue(data);

  return base.filter(
    (item) =>
      (subject === "all" || item.subject === subject) &&
      (topic === "all" || item.topic === topic) &&
      (stars.size === 0 || stars.has(item.stars)),
  );
}

export default function Review({
  store,
  view,
  focus,
  onFocusHandled,
}: {
  store: Store;
  view: Overview;
  focus?: TopicFocus | null;
  onFocusHandled?(): void;
}) {
  const data = store.data!;
  // Chưa có bài nào đến hạn (người mới, hoặc đã ôn hết) thì mở thẳng sang bài
  // chưa làm, để không rơi vào một danh sách trống rồi phải tự mò.
  const [mode, setMode] = useState<Mode>(view.dueToday > 0 ? "due" : "fresh");
  const [subject, setSubject] = useState<SubjectKey | "all">("all");
  const [topic, setTopic] = useState("all");
  // Lọc theo độ khó: tập sao nào đang bật. Rỗng = không lọc.
  const [stars, setStars] = useState<Set<number>>(new Set());
  const [cursor, setCursor] = useState(0);
  const [done, setDone] = useState(0);
  /** Bài đã chấm trong phiên này: id -> kết quả, để đánh dấu ngay trên thẻ bài. */
  const [graded, setGraded] = useState<Record<string, "correct" | "wrong">>({});
  /** Tăng lên khi người dùng bấm dựng lại danh sách. */
  const [rebuild, setRebuild] = useState(0);

  /**
   * Danh sách bài của phiên ôn — **đứng yên** cho tới khi đổi bộ lọc.
   *
   * Cố ý không tính lại theo `data`: chấm một bài là trạng thái bài đó đổi, mà
   * tính lại thì bài vừa chấm rơi khỏi danh sách và app tự nhảy sang bài kế —
   * đúng lúc bạn còn đang ghi chú dở. Giữ nguyên danh sách thì chấm xong vẫn ở
   * lại bài đó, và quay lại bài trước lúc nào cũng được.
   */
  const [queue, setQueue] = useState<CatalogItem[]>(() =>
    buildQueue(data, view.dueToday > 0 ? "due" : "fresh", "all", "all", new Set()),
  );

  useEffect(() => {
    setQueue(buildQueue(data, mode, subject, topic, stars));
    setCursor(0);
    // `data` cố tình không nằm trong danh sách phụ thuộc — xem ghi chú ở `queue`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, subject, topic, stars, rebuild]);

  // Yêu cầu mở một chủ đề từ màn khác: chuyển hẳn sang chế độ ôn cả chủ đề.
  useEffect(() => {
    if (!focus) return;
    setMode("topic");
    setSubject(focus.subject);
    setTopic(focus.topic);
    setStars(new Set()); // bộ lọc sao cũ sẽ giấu mất bài của chủ đề
    setGraded({});
    onFocusHandled?.();
  }, [focus, onFocusHandled]);

  const item = queue[cursor];
  const progress = item ? data.progress[item.id] : undefined;
  const late = item ? overdueDays(progress, todayISO()) : 0;
  const clock = useCountdown(item);

  // Danh sách đứng yên, nên đếm ngay trên đó xem còn bao nhiêu bài chưa xử lý.
  const pending = useMemo(
    () =>
      queue.filter((entry) => {
        const status = data.progress[entry.id]?.status ?? "todo";
        return status === "todo" || status === "wrong";
      }).length,
    [queue, data],
  );

  /** Mở bài trên denken-ou.com và bắt đầu tính giờ cùng lúc. */
  const openAndTime = () => {
    if (!item) return;
    void platform.openExternal(item.url);
    clock.start();
  };

  const toggleStar = (value: number) => {
    setStars((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  /**
   * Chấm một bài — và **ở nguyên tại bài đó**.
   *
   * Chấm xong thường là lúc cần ghi lại cách giải hay chỗ nhầm; tự nhảy sang bài
   * sau sẽ cắt ngang đúng lúc đó. Chuyển bài là việc của người dùng.
   */
  const grade = (result: "correct" | "wrong") => {
    if (!item) return;
    store.review(item.id, result);
    setGraded((current) => ({ ...current, [item.id]: result }));
    setDone((count) => count + 1);
  };

  const go = (delta: number) =>
    setCursor((index) => Math.min(queue.length - 1, Math.max(0, index + delta)));

  // Phím tắt: 1 = đúng, 2 = sai, Space = mở bài, ← → = chuyển bài.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      if (!item) return;

      if (event.key === "1") grade("correct");
      else if (event.key === "2") grade("wrong");
      else if (event.key === "ArrowRight") go(1);
      else if (event.key === "ArrowLeft") go(-1);
      else if (event.code === "Space") {
        event.preventDefault();
        openAndTime();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const justGraded = item ? graded[item.id] : undefined;

  return (
    <div className="container">
      <div className="card">
        <div className="row between wrap" style={{ gap: 12 }}>
          <div className="chip-row">
            <button
              className={`chip${mode === "due" ? " on" : ""}`}
              onClick={() => setMode("due")}
            >
              <Ic i={Target} /> Đến hạn hôm nay ({view.dueToday})
            </button>
            <button
              className={`chip${mode === "wrong" ? " on" : ""}`}
              onClick={() => setMode("wrong")}
            >
              <Ic i={XCircle} /> Đang làm sai ({view.counts.wrong})
            </button>
            <button
              className={`chip${mode === "fresh" ? " on" : ""}`}
              onClick={() => setMode("fresh")}
            >
              <Ic i={Sparkles} /> Bài chưa làm ({view.counts.todo})
            </button>
          </div>
          <div className="small muted nowrap">
            Đã ôn hôm nay: <strong>{view.today.reviewed}</strong>/{view.today.goal}
          </div>
        </div>

        {mode === "topic" ? (
          <div className="callout" style={{ marginTop: 12 }}>
            <div className="row between wrap" style={{ gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                Đang ôn lại cả chủ đề <strong className="ja">{topic}</strong>{" "}
                <span className="small dim">
                  ({subject !== "all" && subjectName(subject)} · {queue.length} bài,
                  còn {pending} bài chưa xử lý)
                </span>
              </div>
              <button className="btn ghost sm" onClick={() => setMode("due")}>
                <Ic i={X} /> Thoát chế độ chủ đề
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="chip-row" style={{ marginTop: 12 }}>
              {SUBJECT_FILTERS.map((entry) => (
                <button
                  key={entry.key}
                  className={`chip${subject === entry.key ? " on" : ""}`}
                  onClick={() => {
                    setSubject(entry.key);
                    setTopic("all");
                  }}
                >
                  <span className={entry.key === "all" ? "" : "ja"}>{entry.label}</span>
                </button>
              ))}
            </div>

            {subject !== "all" && (
              <div className="row" style={{ marginTop: 10 }}>
                <select
                  className="select"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                >
                  <option value="all">
                    Tất cả chủ đề ({topicsBySubject[subject].length})
                  </option>
                  {topicsBySubject[subject].map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="chip-row" style={{ marginTop: 10 }}>
              <span className="small dim">Độ khó:</span>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  className={`chip star-chip${stars.has(value) ? " on" : ""}`}
                  onClick={() => toggleStar(value)}
                  title={`Chỉ ôn bài ${value} sao`}
                >
                  {[1, 2, 3, 4, 5].map((level) => (
                    <Star
                      key={level}
                      className={`h-3 w-3 shrink-0${level > value ? " star-off" : ""}`}
                      strokeWidth={level > value ? 1.75 : 0}
                      fill={level > value ? "none" : "currentColor"}
                    />
                  ))}
                </button>
              ))}
              {stars.size > 0 && (
                <button className="chip" onClick={() => setStars(new Set())}>
                  <Ic i={X} /> Bỏ lọc
                </button>
              )}
            </div>
          </>
        )}

        {done > 0 && (
          <div className="queue-progress" style={{ marginTop: 14 }}>
            <span className="nowrap">Phiên này: {done} lượt</span>
            <Bar
              ratio={view.today.ratio}
              color={view.today.metGoal ? "var(--green)" : "var(--blue)"}
            />
            <span className="nowrap">
              {view.today.metGoal ? "Đạt mục tiêu" : `còn ${view.today.remaining}`}
            </span>
            <button
              className="btn ghost xs"
              onClick={() => setRebuild((n) => n + 1)}
              title="Bỏ những bài đã xử lý xong khỏi danh sách rồi dựng lại từ đầu"
            >
              <Ic i={RotateCcw} /> Dựng lại danh sách
            </button>
          </div>
        )}
      </div>

      {!item ? (
        <div className="card">
          {mode === "topic" ? (
            <Empty icon={Search} title="Chủ đề này chưa có bài nào">
              <p className="muted">
                Có thể tên chủ đề đã đổi ở bản danh mục mới. Thử tìm trong Danh sách bài.
              </p>
            </Empty>
          ) : mode === "wrong" ? (
            <Empty icon={PartyPopper} title="Không còn bài nào đang sai">
              <p className="muted">
                {stars.size > 0 || subject !== "all" || topic !== "all"
                  ? "Không có bài sai nào khớp bộ lọc."
                  : "Mọi bài từng sai đều đã được sửa thành đúng. Quá tốt!"}
              </p>
            </Empty>
          ) : mode === "due" ? (
            <Empty icon={CalendarCheck} title="Không còn bài nào đến hạn">
              <p className="muted">
                {stars.size > 0 || subject !== "all" || topic !== "all"
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
            <Empty icon={Trophy} title="Đã đụng tới toàn bộ giáo trình">
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
            {(item.nameVi || topicVi(item.topic)) && (
              <div className="review-title-vi">
                {item.nameVi || topicVi(item.topic)}
              </div>
            )}

            <div className="small dim">{levelLabel(progress?.srsLevel ?? 0)}</div>

            <div className="review-actions">
              <button
                className={`btn success${justGraded === "correct" ? " chosen" : ""}`}
                onClick={() => grade("correct")}
              >
                <Ic i={CheckCircle2} /> Làm đúng <span className="small dim">1</span>
              </button>
              <button
                className={`btn danger${justGraded === "wrong" ? " chosen" : ""}`}
                onClick={() => grade("wrong")}
              >
                <Ic i={XCircle} /> Làm sai <span className="small dim">2</span>
              </button>
            </div>

            {justGraded && (
              <div className="graded-note">
                Đã ghi nhận <strong>{justGraded === "correct" ? "đúng" : "sai"}</strong>{" "}
                và xếp lịch ôn lại. Vẫn đang ở bài này — cứ ghi chú thoải mái, chuyển
                bài lúc nào là quyền của bạn. Bấm nhầm thì chấm lại bằng nút kia.
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <Timer item={item} clock={clock} />
            </div>

            <div className="btn-row" style={{ marginTop: 12 }}>
              <button
                className="btn ghost sm"
                onClick={() => go(-1)}
                disabled={cursor === 0}
                title="Phím ←"
              >
                ← Bài trước
              </button>
              <button
                className={`btn sm${justGraded ? " primary" : " ghost"}`}
                onClick={() => go(1)}
                disabled={cursor >= queue.length - 1}
                title="Phím →"
              >
                Bài sau →
              </button>
              <span className="spacer" />
              <button className="btn ghost sm" onClick={() => store.snooze(item.id, 1)}>
                <Ic i={Moon} /> Hoãn 1 ngày
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
              store={store}
              compact
              onOpenExercise={openAndTime}
            />
          </div>

          <div className="callout">
            <strong>Phím tắt:</strong> <span className="mono">1</span> làm đúng ·{" "}
            <span className="mono">2</span> làm sai ·{" "}
            <span className="mono">Space</span> mở bài và bắt đầu tính giờ ·{" "}
            <span className="mono">←</span> <span className="mono">→</span> chuyển bài.
            Chấm xong app không tự nhảy bài — bạn tự chuyển khi đã ghi chú xong.
          </div>
        </>
      )}
    </div>
  );
}
