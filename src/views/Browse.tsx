import {
  Bookmark,
  Check,
  CircleDashed,
  Link2,
  Paperclip,
  RotateCcw,
  ArrowUpRight,
  Search,
  Star,
  StickyNote,
  Target,
  X,
  XCircle,
} from "lucide-react";
import { Ic, type IconType } from "../components/ui/icon";
import { useEffect, useMemo, useRef, useState } from "react";

import ItemDetail from "../components/ItemDetail";
import { Empty, Stars, StatusPill, openLink } from "../components/ui";
import { items, subjectName, subjects, topicsBySubject } from "../lib/catalog";
import { isDue, overdueDays, todayISO } from "../lib/srs";
import type { CatalogItem, ItemStatus, SubjectKey } from "../lib/types";
import type { Store } from "../state/useStore";
import { haystackOf, highlight, matchesQuery, topicVi, trichDoan } from "../lib/vi";

import { t, t2 } from "../lib/chu";
/** Chiều cao cố định mỗi dòng — cần cho phép tính cuộn ảo. */
/**
 * Chiều cao một dòng, KHOÁ CỨNG.
 *
 * Danh sách 1609 bài chạy ảo hoá: chỉ vẽ những dòng đang lọt trong khung nhìn,
 * vị trí tính bằng phép nhân với hằng số này. Nội dung cao hơn con số này là
 * các dòng đè lên nhau — nên mọi thứ trong dòng phải cắt bằng dấu ba chấm, và
 * đổi bố cục dòng thì phải đo lại rồi sửa số này.
 */
const ROW_HEIGHT = 84;
/** Vẽ dư vài dòng ngoài khung nhìn để cuộn nhanh không thấy khoảng trắng. */
const OVERSCAN = 6;

type StatusFilter = ItemStatus | "all" | "due" | "starred";

const STATUS_FILTERS: Array<{
  key: StatusFilter;
  label: string;
  icon?: IconType;
}> = [
  { key: "all", label: "Tất cả" },
  { key: "due", label: "Đến hạn", icon: Target },
  { key: "todo", label: "Chưa làm", icon: CircleDashed },
  { key: "wrong", label: "Sai", icon: XCircle },
  { key: "relearned", label: "Sai → Đúng", icon: RotateCcw },
  { key: "correct", label: "Đúng", icon: Check },
  { key: "starred", label: "Đánh dấu sao", icon: Star },
];

export default function Browse({
  store,
  initialSubject,
  onSubjectHandled,
}: {
  store: Store;
  initialSubject: SubjectKey | "all";
  onSubjectHandled(): void;
}) {
  const data = store.data!;
  const today = todayISO();

  const [subject, setSubject] = useState<SubjectKey | "all">(initialSubject);
  const [topic, setTopic] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [stars, setStars] = useState<Set<number>>(new Set());
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  // Sidebar bấm sang một môn: nhận môn đó rồi trả lại quyền điều khiển cho view.
  useEffect(() => {
    if (initialSubject !== "all") {
      setSubject(initialSubject);
      setTopic("all");
      onSubjectHandled();
    }
  }, [initialSubject, onSubjectHandled]);

  const topics = subject === "all" ? [] : topicsBySubject[subject];

  const filtered = useMemo(() => {
    const needle = query.trim();

    return items.filter((item) => {
      if (subject !== "all" && item.subject !== subject) return false;
      if (topic !== "all" && item.topic !== topic) return false;
      if (stars.size > 0 && !stars.has(item.stars)) return false;

      const progress = data.progress[item.id];
      if (status === "due") {
        if (!isDue(progress, today)) return false;
      } else if (status === "starred") {
        if (!progress?.starred) return false;
      } else if (status !== "all") {
        if ((progress?.status ?? "todo") !== status) return false;
      }

      if (needle) {
        const notes = (progress?.notes ?? []).map((note) => note.text).join(" ");
        const labels = (progress?.links ?? [])
          .map((link) => `${link.label} ${link.url}`)
          .join(" ");
        // Tìm được bằng cả tiếng Nhật lẫn tiếng Việt, có dấu hay không đều được.
        if (!matchesQuery(haystackOf(item, notes, labels), needle)) return false;
      }
      return true;
    });
  }, [data.progress, subject, topic, status, stars, query, today]);

  /* ------------------------- cuộn ảo ------------------------- */

  const scroller = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(600);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setViewport(element.clientHeight));
    observer.observe(element);
    setViewport(element.clientHeight);
    return () => observer.disconnect();
  }, []);

  // Đổi bộ lọc thì cuộn về đầu, tránh đang ở giữa danh sách rỗng.
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
    setScrollTop(0);
  }, [subject, topic, status, stars, query]);

  const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(viewport / ROW_HEIGHT) + OVERSCAN * 2;
  const window_ = filtered.slice(first, first + visibleCount);

  const toggleStar = (value: number) =>
    setStars((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });

  const selectedItem = selected
    ? items.find((item) => item.id === selected) ?? null
    : null;

  return (
    <div className="container">
      {/* Bộ lọc */}
      <div className="card">
        <div className="row wrap" style={{ gap: 10, marginBottom: 12 }}>
          <div className="search-wrap">
            <span className="search-icon">
              <Ic i={Search} />
            </span>
            <input
              className="input"
              placeholder={t("Tìm theo tên bài, chủ đề, kỳ thi, hoặc trong ghi chú…")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="small muted nowrap">
            <strong>{filtered.length}</strong> {t2("/ {tong} bài", { tong: items.length })}
          </div>
        </div>

        <div className="chip-row" style={{ marginBottom: 10 }}>
          <button
            className={`chip${subject === "all" ? " on" : ""}`}
            onClick={() => {
              setSubject("all");
              setTopic("all");
            }}
          >
            {t("Tất cả môn")}
          </button>
          {subjects.map((entry) => (
            <button
              key={entry.key}
              className={`chip${subject === entry.key ? " on" : ""}`}
              onClick={() => {
                setSubject(entry.key);
                setTopic("all");
              }}
            >
              <span className="ja">{entry.name}</span> {entry.viName}
            </button>
          ))}
        </div>

        {topics.length > 0 && (
          <div className="row" style={{ marginBottom: 10 }}>
            <select
              className="select"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
            >
              <option value="all">{t2("Tất cả chủ đề ({n})", { n: topics.length })}</option>
              {topics.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="chip-row" style={{ marginBottom: 10 }}>
          {STATUS_FILTERS.map((entry) => (
            <button
              key={entry.key}
              className={`chip${status === entry.key ? " on" : ""}`}
              onClick={() => setStatus(entry.key)}
            >
              {entry.icon && <Ic i={entry.icon} className="h-3.5 w-3.5" />}
              {t(entry.label)}
            </button>
          ))}
        </div>

        <div className="chip-row">
          <span className="small dim">{t("Độ khó:")}</span>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              className={`chip star-chip${stars.has(value) ? " on" : ""}`}
              onClick={() => toggleStar(value)}
              title={t2("Bài {n} sao", { n: value })}
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
              <Ic i={X} /> {t("Bỏ lọc sao")}
            </button>
          )}
        </div>
      </div>

      {/* Danh sách */}
      <div className="card flush">
        {filtered.length === 0 ? (
          <Empty icon={Search} title={t("Không có bài nào khớp")}>
            <p className="muted">{t("Thử bỏ bớt bộ lọc hoặc đổi từ khoá tìm kiếm.")}</p>
          </Empty>
        ) : (
          <div
            className="virtual"
            ref={scroller}
            onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
          >
            <div
              className="virtual-inner"
              style={{ height: filtered.length * ROW_HEIGHT }}
            >
              <div
                className="virtual-window"
                style={{ transform: `translateY(${first * ROW_HEIGHT}px)` }}
              >
                {window_.map((item) => (
                  <Row
                    key={item.id}
                    item={item}
                    store={store}
                    today={today}
                    selected={selected === item.id}
                    query={query}
                    onSelect={() =>
                      setSelected((current) => (current === item.id ? null : item.id))
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chi tiết bài đang chọn */}
      {selectedItem && (
        <div className="card">
          <div className="card-head">
            <div className="card-title">
              <span className="ja">{selectedItem.name}</span>
              {selectedItem.nameVi && (
                <div className="review-title-vi">{selectedItem.nameVi}</div>
              )}
            </div>
            <button className="icon-btn" onClick={() => setSelected(null)} title={t("Đóng")}>
              <Ic i={X} />
            </button>
          </div>
          <div className="review-topic" style={{ marginBottom: 14 }}>
            <span className="ja" style={{ fontWeight: 700, color: "var(--blue)" }}>
              {subjectName(selectedItem.subject)}
            </span>
            <span>·</span>
            <span className="ja">{selectedItem.topic}</span>
            <span>·</span>
            <span>
              {selectedItem.exam} {selectedItem.question}
            </span>
          </div>

          <ItemDetail
            item={selectedItem}
            progress={data.progress[selectedItem.id]}
            store={store}
          />

          <div className="btn-row" style={{ marginTop: 16 }}>
            <button
              className="btn success sm"
              onClick={() => store.review(selectedItem.id, "correct")}
            >
              <Ic i={Check} /> {t("Ghi nhận làm đúng")}
            </button>
            <button
              className="btn danger sm"
              onClick={() => store.review(selectedItem.id, "wrong")}
            >
              <Ic i={XCircle} /> {t("Ghi nhận làm sai")}
            </button>
            <span className="spacer" />
            <button
              className="btn ghost sm"
              onClick={() => store.resetItem(selectedItem.id)}
              title={t("Xoá trạng thái và lịch ôn, giữ nguyên ghi chú và link tham khảo")}
            >
              <Ic i={RotateCcw} /> {t("Đặt lại tiến độ")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Một mẩu chữ, phần khớp câu tìm thì tô sáng. */
function To({ text, q }: { text: string; q: string }) {
  if (!q.trim() || !text) return <>{text}</>;
  return (
    <>
      {highlight(text, q).map((manh, i) =>
        manh.hit ? (
          <mark key={i} className="hit">
            {manh.text}
          </mark>
        ) : (
          <span key={i}>{manh.text}</span>
        ),
      )}
    </>
  );
}

function Row({
  item,
  store,
  today,
  selected,
  query,
  onSelect,
}: {
  item: CatalogItem;
  store: Store;
  today: string;
  selected: boolean;
  /** Câu đang tìm, để tô sáng chỗ khớp. */
  query: string;
  onSelect(): void;
}) {
  const progress = store.data!.progress[item.id];
  const late = overdueDays(progress, today);
  const due = isDue(progress, today);

  // Ghi chú nào chứa câu đang tìm; lấy đoạn quanh chỗ khớp để hiện trong dòng.
  const khopGhiChu = (() => {
    const needle = query.trim();
    if (!needle) return "";
    const note = (progress?.notes ?? []).find((n) => matchesQuery(n.text, needle));
    return note ? trichDoan(note.text, needle) : "";
  })();

  return (
    <div
      className={`item-row${selected ? " selected" : ""}`}
      style={{ height: ROW_HEIGHT }}
      onClick={onSelect}
    >
      <Stars count={item.stars} />
      <div className="item-main">
        <div className="item-title ja">
          {progress?.starred && (
            <span className="item-star" title={t("Bạn đã đánh dấu bài này")}>
              <Star className="h-3.5 w-3.5" strokeWidth={0} fill="currentColor" />
            </span>
          )}
          <To text={item.name} q={query} />
        </div>

        {/* Tiếng Việt hiện luôn, không phải bấm vào mới thấy. Bài chưa dịch thì
            lùi về tên chủ đề — dòng này không bao giờ trống. */}
        <div className="item-title-vi">
          <To text={item.nameVi || topicVi(item.topic)} q={query} />
        </div>
        {/* Khớp nhờ ghi chú thì phải cho thấy chỗ khớp, không thì người dùng
            nhìn vào không hiểu vì sao bài này lại ra. */}
        {khopGhiChu && (
          <div className="item-note">
            <Ic i={StickyNote} className="h-3 w-3" />
            <span className="item-note-text">
              <To text={khopGhiChu} q={query} />
            </span>
          </div>
        )}

        <div className="item-meta">
          <span className="ja">{item.topic}</span>
          <span>·</span>
          <span>
            {item.exam} {item.question}
          </span>
          {(progress?.notes.length ?? 0) > 0 && (
            <span title={t2("{n} ghi chú", { n: progress!.notes.length })}>
              <Ic i={StickyNote} className="h-3.5 w-3.5" />
                  {progress!.notes.length > 1 && progress!.notes.length}
            </span>
          )}
          {(progress?.links.length ?? 0) > 0 && (
            <span title={t2("{n} link tham khảo", { n: progress!.links.length })}>
              <Ic i={Link2} className="h-3.5 w-3.5" />
                  {progress!.links.length > 1 && progress!.links.length}
            </span>
          )}
          {(progress?.notes.some((n) => n.attachments.length > 0) ?? false) && (
            <span title={t("Có file đính kèm")}>
                  <Ic i={Paperclip} className="h-3.5 w-3.5" />
                </span>
          )}
        </div>
      </div>

      {due && (
        <span className={`pill ${late > 0 ? "overdue" : "due"}`}>
          {late > 0 ? t2("quá hạn {n}n", { n: late }) : t("đến hạn")}
        </span>
      )}
      <StatusPill status={progress?.status ?? "todo"} />

      <div className="item-actions" onClick={(event) => event.stopPropagation()}>
        <button
          className={`icon-btn${progress?.starred ? " starred" : ""}`}
          title={
            progress?.starred ? t("Bỏ đánh dấu bài này") : t("Đánh dấu bài này là đáng chú ý")
          }
          aria-pressed={progress?.starred ?? false}
          onClick={() => store.toggleStar(item.id)}
        >
          <Star
            className="h-4 w-4"
            strokeWidth={progress?.starred ? 0 : 1.75}
            fill={progress?.starred ? "currentColor" : "none"}
          />
        </button>
        <button
          className="icon-btn"
          title={t("Mở bài trên denken-ou.com")}
          onClick={() => openLink(item.url)}
        >
          <Ic i={ArrowUpRight} />
        </button>
        {progress?.links.length === 1 && (
          <button
            className="icon-btn on"
            title={t2("Mở link tham khảo: {url}", { url: progress.links[0]!.url })}
            onClick={() => openLink(progress.links[0]!.url)}
          >
            <Ic i={Bookmark} />
          </button>
        )}
      </div>
    </div>
  );
}
