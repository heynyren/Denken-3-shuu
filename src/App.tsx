import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import {
  BookMarked,
  CalendarClock,
  Flame,
  House,
  Scale,
  Settings as SettingsIcon,
  SquarePen,
  Target,
} from "lucide-react";

import mark from "./assets/mark.svg";
import About, { VietnamFlag } from "./components/About";
import BadgeCelebration from "./components/BadgeCelebration";
import { computeOverview } from "./lib/stats";
import { useStore } from "./state/useStore";
import { useSync } from "./state/useSync";
import { useSwipeTabs } from "./state/useSwipeTabs";
import { KeepAlive } from "./components/KeepAlive";
import { platform } from "./platform";
import Dashboard from "./views/Dashboard";
import Review from "./views/Review";
import Browse from "./views/Browse";
import Exam from "./views/Exam";
import Rules from "./views/Rules";
import Settings from "./views/Settings";
import type { TopicFocus } from "./views/Review";
import type { SubjectKey } from "./lib/types";

type Tab = "dashboard" | "review" | "browse" | "exam" | "rules" | "settings";

/**
 * Icon lấy từ bộ Lucide — SVG nét mảnh, cùng một tay vẽ.
 *
 * Trước đây chỗ này là emoji. Emoji do PHÔNG CHỮ CỦA MÁY vẽ chứ không phải app,
 * nên mỗi hệ điều hành ra một kiểu: Windows vẽ phẳng nhiều màu, Android vẽ tròn
 * mập, máy cũ thì vẽ như hồi 2015. Không chỉnh được nét, không chỉnh được màu,
 * và cạnh chữ tiếng Việt thì luôn lệch chân.
 */
const TABS: Array<{
  key: Tab;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}> = [
  { key: "dashboard", icon: House, label: "Hôm nay" },
  { key: "review", icon: Target, label: "Ôn tập" },
  { key: "browse", icon: BookMarked, label: "Danh sách bài" },
  { key: "exam", icon: SquarePen, label: "Thi thử" },
  { key: "rules", icon: Scale, label: "Luật thi" },
  { key: "settings", icon: SettingsIcon, label: "Cài đặt" },
];

const SAVE_TEXT: Record<string, string> = {
  idle: "Đã lưu",
  pending: "Đang chờ lưu…",
  saving: "Đang lưu…",
  saved: "Đã lưu",
  error: "Lỗi khi lưu",
};

export default function App() {
  const store = useStore();
  const sync = useSync(store);
  const [tab, setTabState] = useState<Tab>("dashboard");

  /**
   * Chồng tab đã đi qua, để nút Quay lại của Android lùi từng bước.
   *
   * Không có cái này thì vuốt về là **thoát thẳng app** dù đang ở giữa màn nào —
   * đúng cái cảm giác "vuốt về không mượt". Giữ trong ref chứ không phải state:
   * nó không vẽ ra gì cả, mà để trong state thì mỗi lần đổi tab lại vẽ lại cả
   * cây một lần thừa.
   */
  const lichSu = useRef<Tab[]>(["dashboard"]);

  /** Chiều đi của lần chuyển tab gần nhất: +1 sang phải, -1 sang trái. */
  const [huong, setHuong] = useState(1);

  const setTab = useCallback((next: Tab) => {
    setTabState((hienTai) => {
      const tu = TABS.findIndex((e) => e.key === hienTai);
      const den = TABS.findIndex((e) => e.key === next);
      if (tu >= 0 && den >= 0 && tu !== den) setHuong(den > tu ? 1 : -1);
      if (next !== hienTai) {
        // Quay lại một tab đã ở trong chồng thì cắt bớt thay vì chất thêm, để
        // đi tới đi lui vài lần không sinh ra một chồng dài vô tận.
        const cu = lichSu.current.indexOf(next);
        lichSu.current =
          cu >= 0 ? lichSu.current.slice(0, cu + 1) : [...lichSu.current, next];
      }
      return next;
    });
  }, []);
  // Bấm một môn ở sidebar thì nhảy sang danh sách bài đã lọc sẵn môn đó.
  const [jumpSubject, setJumpSubject] = useState<SubjectKey | "all">("all");
  // Bấm một chủ đề yếu (ở Hôm nay hoặc ở bảng phân tích bài thi) thì mở màn Ôn
  // tập với đúng chủ đề đó, để ôn lại cả mảng kiến thức chứ không vá từng bài.
  const [reviewFocus, setReviewFocus] = useState<TopicFocus | null>(null);
  const [showAbout, setShowAbout] = useState(false);

  /* --- Vuốt ngang để đổi tab --- */
  const soTab = TABS.findIndex((entry) => entry.key === tab);
  useSwipeTabs(soTab, TABS.length, (toi) => {
    const dich = TABS[toi];
    if (dich) setTab(dich.key);
  });

  /* --- Nút Quay lại của Android --- */
  useEffect(() => {
    return platform.onBack(() => {
      // Có gì đang mở đè lên thì đóng cái đó trước, đúng như người ta mong đợi.
      if (showAbout) {
        setShowAbout(false);
        return;
      }
      if (store.justEarned.length > 0) {
        store.clearJustEarned();
        return;
      }
      if (lichSu.current.length > 1) {
        lichSu.current = lichSu.current.slice(0, -1);
        // Nút Quay lại luôn là đi lùi, nên nội dung trôi về bên phải.
        setHuong(-1);
        setTabState(lichSu.current[lichSu.current.length - 1]!);
        return;
      }
      // Đang ở màn gốc rồi thì mới thật sự thoát.
      platform.exitApp();
    });
  }, [showAbout, store]);

  const view = useMemo(
    () => (store.data ? computeOverview(store.data) : null),
    [store.data],
  );

  if (store.loading || !store.data || !view) {
    return (
      <div className="loading">
        <div>
          <div className="spinner" />
          Đang mở sổ ôn thi…
        </div>
      </div>
    );
  }

  const goSubject = (subject: SubjectKey) => {
    setJumpSubject(subject);
    setTab("browse");
  };

  const goTopic = (subject: SubjectKey, topic: string) => {
    setReviewFocus({ subject, topic });
    setTab("review");
  };

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <img src={mark} alt="" />
          <div className="brand-text">
            <div className="brand-title ja">電験三種</div>
            <div className="brand-sub">Sổ ôn thi</div>
          </div>
        </div>

        <div className="header-spacer" />

        <div className="header-stat" title="Chuỗi ngày liên tiếp đạt mục tiêu">
          <Flame className="h-3.5 w-3.5" strokeWidth={2} /> {view.streak.current}
          <span className="label">ngày</span>
        </div>
        <div className="header-stat" title="Số bài đã ôn hôm nay trên mục tiêu">
          {view.today.reviewed}/{view.today.goal}
          <span className="label">hôm nay</span>
        </div>
        <div className="header-stat" title={`Ngày thi ${view.examDate}`}>
          <CalendarClock className="h-3.5 w-3.5" strokeWidth={2} /> {view.daysToExam}
          <span className="label">ngày tới kỳ thi</span>
        </div>
        <div className="header-stat" title={SAVE_TEXT[store.saveState]}>
          <span className={`save-dot ${store.saveState}`} />
          <span className="label">{SAVE_TEXT[store.saveState]}</span>
        </div>
      </header>

      <nav className="sidebar">
        {/* Năm tab chính. Trên điện thoại, đúng nhóm này biến thành thanh tab
            dưới đáy màn hình; phần còn lại của thanh bên bị ẩn đi. */}
        <div className="nav-tabs">
          {TABS.map((entry) => (
          <button
            key={entry.key}
            className={`nav-item${tab === entry.key ? " active" : ""}`}
            onClick={() => setTab(entry.key)}
          >
            <span className="nav-icon">
              <entry.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </span>
            <span className="nav-label">{entry.label}</span>
            {entry.key === "review" && view.dueToday > 0 && (
              <span className="nav-badge">{view.dueToday}</span>
            )}
            </button>
          ))}
        </div>

        <div className="nav-extra">
        <div className="sidebar-divider" />
        <div className="sidebar-section">Bốn môn</div>
        {view.bySubject.map((subject) => (
          <button
            key={subject.key}
            className="nav-item"
            onClick={() => goSubject(subject.key)}
            title={`${subject.attempted}/${subject.total} bài đã làm`}
          >
            <span className="subject-row" style={{ flex: 1, padding: 0 }}>
              <span className="ja">{subject.name}</span>
              <span className="vi">{subject.viName}</span>
              <span className="pct">{Math.round(subject.progress * 100)}%</span>
            </span>
          </button>
        ))}

        <div className="sidebar-divider" />
        <div className="sidebar-section">Tổng tiến độ</div>
        <div style={{ padding: "4px 12px 12px" }}>
          <div className="row between small muted" style={{ marginBottom: 6 }}>
            <span>{view.attempted} / {view.total} bài</span>
            <span>{Math.round(view.progress * 100)}%</span>
          </div>
          <div className="bar thin">
            <div
              className="bar-fill"
              style={{ width: `${view.progress * 100}%`, background: "var(--blue)" }}
            />
          </div>
        </div>

        <button
          className="about-btn"
          onClick={() => setShowAbout(true)}
          title="Giới thiệu tác giả"
        >
          <VietnamFlag size={18} />
          <span>Về tác giả — Nyren Phạm</span>
        </button>
        </div>
      </nav>

      {/* Mỗi màn mount một lần rồi ở lại, chỉ ẩn đi khi sang tab khác. Nhờ vậy
          bộ lọc, vị trí cuộn và bài thi đang làm dở không bị mất. Xem
          components/KeepAlive.tsx. */}
      <main className="main">
        <KeepAlive active={tab === "dashboard"} direction={huong}>
          <Dashboard
            store={store}
            view={view}
            onStartReview={() => setTab("review")}
            onOpenSubject={goSubject}
            onOpenTopic={goTopic}
          />
        </KeepAlive>
        <KeepAlive active={tab === "review"} direction={huong}>
          <Review
            store={store}
            view={view}
            focus={reviewFocus}
            onFocusHandled={() => setReviewFocus(null)}
          />
        </KeepAlive>
        <KeepAlive active={tab === "browse"} direction={huong}>
          <Browse
            store={store}
            initialSubject={jumpSubject}
            onSubjectHandled={() => setJumpSubject("all")}
          />
        </KeepAlive>
        <KeepAlive active={tab === "exam"} direction={huong}>
          <Exam store={store} onOpenTopic={goTopic} />
        </KeepAlive>
        <KeepAlive active={tab === "rules"} direction={huong}>
          <Rules store={store} />
        </KeepAlive>
        <KeepAlive active={tab === "settings"} direction={huong}>
          <Settings
            store={store}
            view={view}
            sync={sync}
            onAbout={() => setShowAbout(true)}
          />
        </KeepAlive>
      </main>

      {showAbout && <About onClose={() => setShowAbout(false)} />}

      {/* Chạm mốc lúc đang học thì popup này nhảy lên; người dùng tự tắt. */}
      {store.justEarned.length > 0 && (
        <BadgeCelebration earned={store.justEarned} onClose={store.clearJustEarned} />
      )}
    </div>
  );
}
