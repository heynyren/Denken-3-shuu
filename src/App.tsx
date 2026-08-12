import { useMemo, useState } from "react";

import mark from "./assets/mark.svg";
import About, { VietnamFlag } from "./components/About";
import BadgeCelebration from "./components/BadgeCelebration";
import { computeOverview } from "./lib/stats";
import { useStore } from "./state/useStore";
import Dashboard from "./views/Dashboard";
import Review from "./views/Review";
import Browse from "./views/Browse";
import Exam from "./views/Exam";
import Settings from "./views/Settings";
import type { TopicFocus } from "./views/Review";
import type { SubjectKey } from "./lib/types";

type Tab = "dashboard" | "review" | "browse" | "exam" | "settings";

const TABS: Array<{ key: Tab; icon: string; label: string }> = [
  { key: "dashboard", icon: "🏠", label: "Hôm nay" },
  { key: "review", icon: "🎯", label: "Ôn tập" },
  { key: "browse", icon: "📚", label: "Danh sách bài" },
  { key: "exam", icon: "📝", label: "Thi thử" },
  { key: "settings", icon: "⚙️", label: "Cài đặt" },
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
  const [tab, setTab] = useState<Tab>("dashboard");
  // Bấm một môn ở sidebar thì nhảy sang danh sách bài đã lọc sẵn môn đó.
  const [jumpSubject, setJumpSubject] = useState<SubjectKey | "all">("all");
  // Bấm một chủ đề yếu (ở Hôm nay hoặc ở bảng phân tích bài thi) thì mở màn Ôn
  // tập với đúng chủ đề đó, để ôn lại cả mảng kiến thức chứ không vá từng bài.
  const [reviewFocus, setReviewFocus] = useState<TopicFocus | null>(null);
  const [showAbout, setShowAbout] = useState(false);

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
          🔥 {view.streak.current}
          <span className="label">ngày</span>
        </div>
        <div className="header-stat" title="Số bài đã ôn hôm nay trên mục tiêu">
          {view.today.reviewed}/{view.today.goal}
          <span className="label">hôm nay</span>
        </div>
        <div className="header-stat" title={`Ngày thi ${view.examDate}`}>
          ⏳ {view.daysToExam}
          <span className="label">ngày tới kỳ thi</span>
        </div>
        <div className="header-stat" title={SAVE_TEXT[store.saveState]}>
          <span className={`save-dot ${store.saveState}`} />
          <span className="label">{SAVE_TEXT[store.saveState]}</span>
        </div>
      </header>

      <nav className="sidebar">
        {TABS.map((entry) => (
          <button
            key={entry.key}
            className={`nav-item${tab === entry.key ? " active" : ""}`}
            onClick={() => setTab(entry.key)}
          >
            <span className="nav-icon">{entry.icon}</span>
            <span className="nav-label">{entry.label}</span>
            {entry.key === "review" && view.dueToday > 0 && (
              <span className="nav-badge">{view.dueToday}</span>
            )}
          </button>
        ))}

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
      </nav>

      <main className="main">
        {tab === "dashboard" && (
          <Dashboard
            store={store}
            view={view}
            onStartReview={() => setTab("review")}
            onOpenSubject={goSubject}
            onOpenTopic={goTopic}
          />
        )}
        {tab === "review" && (
          <Review
            store={store}
            view={view}
            focus={reviewFocus}
            onFocusHandled={() => setReviewFocus(null)}
          />
        )}
        {tab === "browse" && (
          <Browse
            store={store}
            initialSubject={jumpSubject}
            onSubjectHandled={() => setJumpSubject("all")}
          />
        )}
        {tab === "exam" && <Exam store={store} onOpenTopic={goTopic} />}
        {tab === "settings" && <Settings store={store} view={view} />}
      </main>

      {showAbout && <About onClose={() => setShowAbout(false)} />}

      {/* Chạm mốc lúc đang học thì popup này nhảy lên; người dùng tự tắt. */}
      {store.justEarned.length > 0 && (
        <BadgeCelebration earned={store.justEarned} onClose={store.clearJustEarned} />
      )}
    </div>
  );
}
