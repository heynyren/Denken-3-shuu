import { useMemo } from "react";

import { BADGES } from "../lib/badges";
import { dailySeries, upcomingLoad, weeklySeries } from "../lib/stats";
import type { Overview } from "../lib/stats";
import type { SubjectKey } from "../lib/types";
import type { Store } from "../state/useStore";
import {
  Bar,
  BarChart,
  Heatmap,
  Ring,
  StatusStack,
  STATUS_COLOR,
  STATUS_TEXT,
} from "../components/ui";

/** Câu chào đổi theo giờ trong ngày, cho đỡ khô khan. */
function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Khuya rồi, cố lên";
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 14) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

/** Một câu động viên chọn theo tình hình hôm nay. */
function encouragement(view: Overview): string {
  if (view.today.metGoal) return "Xong mục tiêu hôm nay rồi. Nghỉ ngơi thôi!";
  if (view.today.reviewed === 0 && view.dueToday > 0)
    return `Có ${view.dueToday} bài đang chờ. Bắt đầu từ bài đầu tiên nhé.`;
  if (view.today.reviewed === 0) return "Hôm nay chưa làm bài nào. Mở màn thôi!";
  if (view.today.remaining <= 5)
    return `Sát rồi, chỉ còn ${view.today.remaining} bài nữa là đạt mục tiêu.`;
  return `Còn ${view.today.remaining} bài nữa là đạt mục tiêu hôm nay.`;
}

export default function Dashboard({
  store,
  view,
  onStartReview,
  onOpenSubject,
}: {
  store: Store;
  view: Overview;
  onStartReview(): void;
  onOpenSubject(subject: SubjectKey): void;
}) {
  const data = store.data!;

  const heat = useMemo(() => dailySeries(data, 119), [data]);
  const weeks = useMemo(() => weeklySeries(data, 12), [data]);
  const upcoming = useMemo(() => upcomingLoad(data, 14), [data]);

  const earned = BADGES.filter((badge) => data.badges[badge.id]);
  const locked = BADGES.filter((badge) => !data.badges[badge.id]);
  // Ba huy hiệu sắp đạt nhất, để có mục tiêu ngắn hạn nhìn thấy được.
  const nearest = locked
    .map((badge) => ({ badge, ratio: badge.progress(view, data) }))
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 3);

  const maxUpcoming = Math.max(1, ...upcoming.map((day) => day.count));

  // Lần chạy đầu: app mới cài chưa có tiến độ nào, mời nhập từ Excel.
  const isFresh = Object.keys(data.progress).length === 0;

  return (
    <div className="container">
      {isFresh && (
        <div className="card">
          <div style={{ fontSize: 17, fontWeight: 700 }}>
            👋 Chào mừng bạn đến với sổ ôn thi <span className="ja">電験三種</span>
          </div>
          <div className="small muted" style={{ marginTop: 5 }}>
            App đã có sẵn đầy đủ <strong>{view.total} bài</strong> của cả bốn môn,
            kèm link tới denken-ou.com và độ khó từng bài. Chọn cách bắt đầu:
          </div>

          <div className="grid cols-2" style={{ marginTop: 14 }}>
            <div className="card tight" style={{ background: "var(--surface-2)" }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                🌱 Mới bắt đầu học
              </div>
              <div className="small muted" style={{ marginBottom: 12 }}>
                Bắt đầu từ con số không. App sẽ tự xếp lịch ôn cho từng bài bạn làm.
              </div>
              <button className="btn primary block" onClick={onStartReview}>
                Học bài đầu tiên →
              </button>
            </div>

            <div className="card tight" style={{ background: "var(--surface-2)" }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                📥 Đã có file Excel theo dõi
              </div>
              <div className="small muted" style={{ marginBottom: 12 }}>
                Nhập vào để giữ nguyên ghi chú, link tham khảo và lịch ôn đang có.
              </div>
              <button
                className="btn block"
                onClick={async () => {
                  const result = await window.denken.importXlsx();
                  if (result.ok && result.data) store.replaceAll(result.data);
                }}
              >
                Chọn file Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hàng trên: vòng KPI + streak + đếm ngược */}
      <div className="grid cols-3">
        <div className="card">
          <div className="ring-wrap">
            <Ring
              ratio={view.today.ratio}
              color={view.today.metGoal ? "var(--green)" : "var(--blue)"}
            >
              <div>
                <div className="ring-value">{view.today.reviewed}</div>
                <div className="ring-caption">/ {view.today.goal} bài</div>
              </div>
            </Ring>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>
                {greeting()}!
              </div>
              <div className="small muted" style={{ marginTop: 4 }}>
                {encouragement(view)}
              </div>
              {view.today.reviewed > 0 && (
                <div className="small dim" style={{ marginTop: 6 }}>
                  Đúng {view.today.correct} · Sai {view.today.wrong}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="streak-hero">
          <span className="flame">{view.streak.current > 0 ? "🔥" : "🕯️"}</span>
          <div style={{ minWidth: 0 }}>
            <div className="streak-num">{view.streak.current}</div>
            <div className="streak-label">ngày liên tiếp đạt mục tiêu</div>
            {view.streak.atRisk ? (
              <div className="streak-warn" style={{ marginTop: 6 }}>
                ⚠️ Học hôm nay để giữ chuỗi!
              </div>
            ) : (
              <div className="small dim" style={{ marginTop: 6 }}>
                Kỷ lục: {view.streak.longest} ngày
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="stat-label">📆 Còn lại tới kỳ thi</div>
          <div
            className={`stat-value ${view.daysToExam <= 30 ? "red" : "amber"}`}
            style={{ marginTop: 4 }}
          >
            {view.daysToExam > 0 ? view.daysToExam : 0}
            <span style={{ fontSize: 15, fontWeight: 600 }}> ngày</span>
          </div>
          <div className="stat-foot" style={{ marginTop: 6 }}>
            Ngày thi {view.examDate}
          </div>
          {view.counts.todo > 0 && view.daysToExam > 0 && (
            <div className="small muted" style={{ marginTop: 10 }}>
              Cần <strong>{view.paceNeeded} bài/ngày</strong> để quét hết{" "}
              {view.counts.todo} bài chưa làm.
            </div>
          )}
        </div>
      </div>

      {/* Nút bắt đầu ôn */}
      <div className="card">
        <div className="row between wrap" style={{ gap: 14 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              {view.dueToday > 0
                ? `${view.dueToday} bài đến hạn ôn hôm nay`
                : "Không còn bài nào đến hạn"}
            </div>
            <div className="small muted" style={{ marginTop: 3 }}>
              {view.overdue > 0
                ? `Trong đó ${view.overdue} bài đã quá hạn — nên ưu tiên làm trước.`
                : "Ôn đúng lịch giúp nhớ lâu hơn nhiều so với học dồn."}
            </div>
          </div>
          <button className="btn primary lg" onClick={onStartReview}>
            {view.dueToday > 0 ? "Bắt đầu ôn →" : "Học bài mới →"}
          </button>
        </div>
      </div>

      {/* Bốn ô số liệu tổng */}
      <div className="grid cols-4">
        <div className="stat">
          <div className="stat-label">📚 Đã làm</div>
          <div className="stat-value blue">{view.attempted}</div>
          <div className="stat-foot">
            trên tổng {view.total} bài · {Math.round(view.progress * 100)}%
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">🧠 Nhớ lâu</div>
          <div className="stat-value green">{view.mastered}</div>
          <div className="stat-foot">bài đạt chu kỳ ôn từ 14 ngày trở lên</div>
        </div>
        <div className="stat">
          <div className="stat-label">❌ Đang sai</div>
          <div className="stat-value red">{view.counts.wrong}</div>
          <div className="stat-foot">cần quay lại xử lý</div>
        </div>
        <div className="stat">
          <div className="stat-label">⬜ Chưa làm</div>
          <div className="stat-value">{view.counts.todo}</div>
          <div className="stat-foot">còn lại trong giáo trình</div>
        </div>
      </div>

      {/* Tiến độ từng môn */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">Tiến độ từng môn</div>
          <div className="legend">
            {(["correct", "relearned", "wrong", "todo"] as const).map((status) => (
              <span key={status}>
                <i style={{ background: STATUS_COLOR[status] }} />
                {STATUS_TEXT[status]}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {view.bySubject.map((subject) => (
            <div key={subject.key}>
              <div className="row between" style={{ marginBottom: 6 }}>
                <div className="row" style={{ gap: 8 }}>
                  <span
                    className="link ja"
                    style={{ fontWeight: 700 }}
                    onClick={() => onOpenSubject(subject.key)}
                  >
                    {subject.name}
                  </span>
                  <span className="small dim">{subject.viName}</span>
                  {subject.due > 0 && (
                    <span className="pill due">{subject.due} đến hạn</span>
                  )}
                </div>
                <div className="small muted nowrap">
                  {subject.attempted}/{subject.total} ·{" "}
                  {Math.round(subject.progress * 100)}%
                </div>
              </div>
              <StatusStack counts={subject.counts} />
            </div>
          ))}
        </div>
      </div>

      {/* Biểu đồ tiến bộ */}
      <div className="grid cols-2">
        <div className="card">
          <div className="card-head">
            <div className="card-title">
              12 tuần gần đây
              <div className="card-sub">Số lượt ôn mỗi tuần</div>
            </div>
          </div>
          {weeks.some((week) => week.reviewed > 0) ? (
            <>
              <BarChart data={weeks} />
              <div className="legend" style={{ marginTop: 10 }}>
                <span>
                  <i style={{ background: "var(--blue)" }} />
                  Đúng
                </span>
                <span>
                  <i style={{ background: "var(--red)" }} />
                  Sai
                </span>
              </div>
            </>
          ) : (
            <div className="empty small">
              Chưa có dữ liệu. Ôn vài bài là biểu đồ hiện lên ngay.
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">
              Lịch ôn 14 ngày tới
              <div className="card-sub">Biết trước ngày nào nặng để sắp xếp</div>
            </div>
          </div>
          <div className="chart-bars" style={{ height: 130 }}>
            {upcoming.map((day, index) => (
              <div
                className="chart-bar"
                key={day.date}
                title={`${day.date}: ${day.count} bài`}
              >
                <div
                  className="chart-bar-fill"
                  style={{
                    height: `${(day.count / maxUpcoming) * 100}%`,
                    background: index === 0 ? "var(--amber)" : "var(--blue)",
                  }}
                />
              </div>
            ))}
          </div>
          <div className="chart-axis">
            {upcoming.map((day, index) => (
              <span key={day.date}>{index === 0 ? "nay" : day.date.slice(8)}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Lịch nhiệt */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">
            Nhịp học 17 tuần qua
            <div className="card-sub">Ô càng sáng là ngày đó học càng nhiều</div>
          </div>
        </div>
        <Heatmap days={heat} goal={view.today.goal} />
        <div className="legend" style={{ marginTop: 10 }}>
          <span>Ít</span>
          {["var(--surface-2)", "#193b63", "#1d4d8c", "#2569c4", "#2d88ff"].map(
            (color) => (
              <i
                key={color}
                style={{ background: color, width: 12, height: 12, marginRight: 0 }}
              />
            ),
          )}
          <span>Nhiều</span>
        </div>
      </div>

      {/* Huy hiệu */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">
            Huy hiệu
            <div className="card-sub">
              Đã mở {earned.length}/{BADGES.length}
            </div>
          </div>
        </div>

        {nearest.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="small muted" style={{ marginBottom: 8 }}>
              Sắp mở khoá
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {nearest.map(({ badge, ratio }) => (
                <div key={badge.id}>
                  <div className="row between small" style={{ marginBottom: 4 }}>
                    <span>
                      {badge.icon} {badge.name}
                    </span>
                    <span className="dim">{Math.round(ratio * 100)}%</span>
                  </div>
                  <Bar ratio={ratio} thin />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="badge-grid">
          {BADGES.map((badge) => {
            const on = data.badges[badge.id];
            return (
              <div
                className={`badge${on ? "" : " locked"}`}
                key={badge.id}
                title={badge.description}
              >
                <div className="badge-icon">{badge.icon}</div>
                <div className="badge-name">{badge.name}</div>
                {on ? (
                  <div className="badge-date">{on}</div>
                ) : (
                  <div
                    className="badge-progress"
                    style={{ width: `${badge.progress(view, data) * 100}%` }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
