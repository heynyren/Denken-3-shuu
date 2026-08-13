/**
 * Màn Hôm nay — bản dựng lại theo hệ thiết kế mới.
 *
 * Tạo hình theo bản mô tả Raycast trong repo design-ai: nền đen nhiều tầng,
 * viền nửa pixel, chữ font hệ thống, và **đúng một màu nhấn** dùng rất dè.
 *
 * Ba luật của bản mô tả được giữ chặt nhất ở đây:
 *
 *   1. Chỉ một thứ trên màn được mang màu nhấn tại một thời điểm. Ở đây là vòng
 *      tiến độ ngày và nút bắt đầu ôn — vì đó là việc bạn mở app ra để làm.
 *   2. Nhãn mục là 11px viết hoa, KHÔNG in đậm. Đó là thứ làm màn hình trông có
 *      tổ chức mà không ồn ào.
 *   3. Không chuyển màu trang trí, không hình minh hoạ. Phân tầng bằng độ sáng
 *      nền và một đường viền mảnh, chấm hết.
 *
 * Biểu đồ ở đây cố ý viết riêng chứ không dùng lại `components/ui.tsx`: bốn màn
 * còn lại vẫn đang dùng file đó với bảng màu cũ, sửa vào là đổi lây sang chúng.
 */

import { useMemo } from "react";
import type { ComponentType } from "react";
import {
  AlertTriangle,
  Award,
  BookOpen,
  Brain,
  CalendarClock,
  CalendarDays,
  Check,
  Circle,
  Flame,
  History,
  Layers,
  Stethoscope,
  Target,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react";

import { BADGES } from "../lib/badges";
import { subjectName, subjectViName } from "../lib/catalog";
import { recentActivity } from "../lib/history";
import { dailySeries, upcomingLoad, weeklySeries } from "../lib/stats";
import { topicVi } from "../lib/vi";
import { todayISO } from "../lib/srs";
import { MIN_ATTEMPTS, weakTopics } from "../lib/weakness";
import type { Overview } from "../lib/stats";
import type { ItemStatus, SubjectKey } from "../lib/types";
import type { Store } from "../state/useStore";
import { platform } from "../platform";
import { Ic } from "../components/ui/icon";
import { Panel, PanelHead } from "../components/ui/panel";
import { Badge, Button, Dial, Meter, Row } from "../components/ui/primitives";

/* ------------------------------------------------------------------ */
/* Màu theo trạng thái — dùng bộ màu hệ thống của macOS, trầm hơn bản cũ */
/* ------------------------------------------------------------------ */

const STATUS_TONE: Record<ItemStatus, string> = {
  correct: "var(--color-good)",
  relearned: "var(--color-info)",
  wrong: "var(--color-bad)",
  todo: "var(--color-hover)",
};

const STATUS_LABEL: Record<ItemStatus, string> = {
  correct: "Đúng",
  relearned: "Sai → Đúng",
  wrong: "Sai",
  todo: "Chưa làm",
};

const STATUS_ORDER: ItemStatus[] = ["correct", "relearned", "wrong", "todo"];

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

/* ------------------------------------------------------------------ */
/* Mảnh dựng riêng cho màn này                                         */
/* ------------------------------------------------------------------ */

/** Thanh chia bốn trạng thái của một môn. */
function StatusBar({ counts }: { counts: Record<ItemStatus, number> }) {
  const total =
    counts.correct + counts.relearned + counts.wrong + counts.todo || 1;
  return (
    <div className="flex h-[6px] w-full overflow-hidden rounded-full bg-sunken">
      {STATUS_ORDER.map((status) => (
        <span
          key={status}
          title={`${STATUS_LABEL[status]}: ${counts[status]}`}
          style={{
            width: `${(counts[status] / total) * 100}%`,
            background: STATUS_TONE[status],
          }}
        />
      ))}
    </div>
  );
}

/** Ô số liệu nhỏ: nhãn viết hoa ở trên, số to ở giữa, chú thích ở dưới. */
function Stat({
  icon: Icon,
  label,
  value,
  foot,
  tone = "text-ink",
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: number | string;
  foot: string;
  tone?: string;
}) {
  return (
    <Panel className="p-3.5">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-ink-4" strokeWidth={2} />
        <span className="dx-eyebrow">{label}</span>
      </div>
      <div
        className={`mt-1.5 text-hero font-semibold tabular-nums tracking-tight ${tone}`}
      >
        {value}
      </div>
      <div className="mt-1 text-tiny text-ink-3">{foot}</div>
    </Panel>
  );
}

/** Cột đứng cho biểu đồ tuần và lịch 14 ngày. */
function Columns({
  bars,
  labels,
  height = 116,
}: {
  bars: Array<Array<{ ratio: number; tone: string }>>;
  labels: string[];
  height?: number;
}) {
  return (
    <div>
      <div className="flex items-end gap-1" style={{ height }}>
        {bars.map((stack, index) => (
          <div key={index} className="flex h-full flex-1 flex-col justify-end gap-px">
            {stack.map((part, layer) => (
              <div
                key={layer}
                className="w-full rounded-[3px]"
                style={{
                  height: `${Math.max(part.ratio * 100, part.ratio > 0 ? 3 : 0)}%`,
                  background: part.tone,
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1 text-micro text-ink-4">
        {labels.map((label, index) => (
          <span key={index} className="flex-1 truncate text-center">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Chú giải màu, dùng chung cho các biểu đồ. */
function Legend({ items }: { items: Array<{ tone: string; text: string }> }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <span key={item.text} className="flex items-center gap-1.5 text-micro text-ink-3">
          <i
            className="block h-2 w-2 rounded-[2px]"
            style={{ background: item.tone }}
          />
          {item.text}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function Dashboard({
  store,
  view,
  onStartReview,
  onOpenSubject,
  onOpenTopic,
}: {
  store: Store;
  view: Overview;
  onStartReview(): void;
  onOpenSubject(subject: SubjectKey): void;
  /** Bấm một chủ đề yếu thì mở màn Ôn tập với toàn bộ chủ đề đó. */
  onOpenTopic(subject: SubjectKey, topic: string): void;
}) {
  const data = store.data!;

  const heat = useMemo(() => dailySeries(data, 119), [data]);
  const weeks = useMemo(() => weeklySeries(data, 12), [data]);
  const upcoming = useMemo(() => upcomingLoad(data, 14), [data]);
  const weak = useMemo(() => weakTopics(data, 5), [data]);
  const activity = useMemo(() => recentActivity(data, 3), [data]);
  const weakSubjects = view.bySubject.filter(
    (subject) => weak[subject.key].length > 0,
  );

  // Huy hiệu chưa đạt không hiện ở đâu cả — bất ngờ thì mới vui.
  const today = todayISO();
  const earned = BADGES.filter((badge) => data.badges[badge.id]);
  const earnedToday = earned.filter((badge) => data.badges[badge.id] === today);

  const maxUpcoming = Math.max(1, ...upcoming.map((day) => day.count));
  const maxWeek = Math.max(1, ...weeks.map((w) => w.correct + w.wrong));
  const maxHeat = Math.max(1, ...heat.map((d) => d.reviewed));

  // Lần chạy đầu: app mới cài chưa có tiến độ nào, mời nhập từ Excel.
  const isFresh = Object.keys(data.progress).length === 0;

  return (
    <div className="container">
      {isFresh && (
        <Panel>
          <div className="text-title font-semibold">
            Chào mừng bạn đến với sổ ôn thi <span className="ja">電験三種</span>
          </div>
          <p className="mt-2 max-w-[640px] text-small text-ink-2">
            App đã có sẵn đầy đủ <strong className="text-ink">{view.total} bài</strong>{" "}
            của cả bốn môn, kèm link tới denken-ou.com và độ khó từng bài. Cứ làm bài,
            app sẽ tự xếp lịch ôn lại đúng lúc bạn sắp quên.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Button tone="accent" onClick={onStartReview}>
              Học bài đầu tiên →
            </Button>
            {/* Lối nhập Excel để nhỏ: chỉ người chuyển từ file theo dõi cũ mới cần. */}
            {platform.can.excelImport && (
              <span className="text-small text-ink-3">
                Đã có file Excel theo dõi từ trước?{" "}
                <button
                  className="dx-btn text-accent underline underline-offset-2 hover:text-accent-dim"
                  onClick={async () => {
                    const result = await platform.importXlsx();
                    if (result.ok && result.data) store.replaceAll(result.data);
                  }}
                >
                  Nhập vào đây
                </button>
              </span>
            )}
          </div>
        </Panel>
      )}

      {/* ---- Khối mở đầu: tiến độ ngày, chuỗi ngày, đếm ngược ---- */}
      <Panel className="p-0">
        <div className="dx-grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)]">
          {/* Tiến độ hôm nay */}
          <div className="flex items-center gap-4 p-4">
            <Dial
              value={view.today.ratio}
              tone={
                view.today.metGoal ? "var(--color-good)" : "var(--color-accent)"
              }
            >
              <div className="text-title font-semibold tabular-nums">
                {view.today.reviewed}
              </div>
              <div className="text-micro text-ink-3">/ {view.today.goal}</div>
            </Dial>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-ink-4" strokeWidth={2} />
                <span className="dx-eyebrow">Hôm nay</span>
              </div>
              <div className="mt-1 text-lead font-semibold">{greeting()}!</div>
              <p className="mt-1 text-small text-ink-2">{encouragement(view)}</p>
              {view.today.reviewed > 0 && (
                <div className="mt-2 flex gap-2">
                  <Badge tone="good">Đúng {view.today.correct}</Badge>
                  <Badge tone="bad">Sai {view.today.wrong}</Badge>
                </div>
              )}
            </div>
          </div>

          {/* Chuỗi ngày */}
          <div className="flex items-center gap-4 border-t-[0.5px] border-hairline p-4 lg:border-t-0 lg:border-l-[0.5px]">
            <Flame
              className={`h-8 w-8 shrink-0 ${
                view.streak.current > 0 ? "text-accent" : "text-ink-4"
              }`}
              strokeWidth={1.5}
            />
            <div className="min-w-0">
              <div className="dx-eyebrow">Chuỗi ngày</div>
              <div className="mt-1 text-hero font-semibold tabular-nums leading-none">
                {view.streak.current}
              </div>
              <div className="mt-1.5 text-tiny text-ink-3">
                ngày liên tiếp đạt mục tiêu
              </div>
              {view.streak.atRisk ? (
                <Badge tone="warn" className="mt-2">
                  <AlertTriangle className="h-3 w-3" strokeWidth={2.25} />
                  Học hôm nay để giữ chuỗi
                </Badge>
              ) : (
                <div className="mt-2 text-tiny text-ink-4">
                  Kỷ lục {view.streak.longest} ngày
                </div>
              )}
            </div>
          </div>

          {/* Đếm ngược tới kỳ thi */}
          <div className="border-t-[0.5px] border-hairline p-4 lg:border-t-0 lg:border-l-[0.5px]">
            <div className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 text-ink-4" strokeWidth={2} />
              <span className="dx-eyebrow">Còn lại tới kỳ thi</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span
                className={`text-hero font-semibold tabular-nums leading-none ${
                  view.daysToExam <= 30 ? "text-bad" : "text-ink"
                }`}
              >
                {view.daysToExam > 0 ? view.daysToExam : 0}
              </span>
              <span className="text-small text-ink-3">ngày</span>
            </div>
            <div className="mt-1.5 text-tiny text-ink-4">Ngày thi {view.examDate}</div>
            {view.remaining > 0 && view.daysToExam > 0 && (
              <p className="mt-2.5 text-tiny text-ink-2">
                Cần <strong className="text-ink">{view.paceNeeded} bài/ngày</strong> để
                xử lý hết {view.remaining} bài còn nợ ({view.counts.todo} chưa làm +{" "}
                {view.counts.wrong} đang sai).
              </p>
            )}
          </div>
        </div>
      </Panel>

      {/* ---- Việc chính của hôm nay ---- */}
      <Panel>
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-lead font-semibold">
              {view.dueToday > 0
                ? `${view.dueToday} bài đến hạn ôn hôm nay`
                : "Không còn bài nào đến hạn"}
            </div>
            <p className="mt-1 text-small text-ink-2">
              {view.overdue > 0
                ? `Trong đó ${view.overdue} bài đã quá hạn — nên ưu tiên làm trước.`
                : "Ôn đúng lịch giúp nhớ lâu hơn nhiều so với học dồn."}
            </p>
          </div>
          <Button tone="accent" onClick={onStartReview}>
            {view.dueToday > 0 ? "Bắt đầu ôn →" : "Học bài mới →"}
          </Button>
        </div>
      </Panel>

      {/* ---- Bốn số liệu tổng ---- */}
      <div className="dx-grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          icon={BookOpen}
          label="Đã làm"
          value={view.attempted}
          foot={`trên ${view.total} bài · ${Math.round(view.progress * 100)}%`}
        />
        <Stat
          icon={Brain}
          label="Nhớ lâu"
          value={view.mastered}
          tone="text-good"
          foot="đạt chu kỳ ôn từ 14 ngày trở lên"
        />
        <Stat
          icon={XCircle}
          label="Đang sai"
          value={view.counts.wrong}
          tone="text-bad"
          foot="cần quay lại xử lý"
        />
        <Stat
          icon={Circle}
          label="Chưa làm"
          value={view.counts.todo}
          tone="text-ink-2"
          foot="còn lại trong giáo trình"
        />
      </div>

      {/* ---- Tiến độ từng môn ---- */}
      <Panel>
        <PanelHead
          icon={Layers}
          eyebrow="Bốn môn"
          title="Tiến độ từng môn"
          right={
            <Legend
              items={STATUS_ORDER.map((status) => ({
                tone: STATUS_TONE[status],
                text: STATUS_LABEL[status],
              }))}
            />
          }
        />
        <div className="flex flex-col gap-4">
          {view.bySubject.map((subject) => (
            <div key={subject.key}>
              <div className="mb-2 flex items-center gap-2">
                <button
                  className="dx-btn ja text-body font-semibold hover:text-accent"
                  onClick={() => onOpenSubject(subject.key)}
                >
                  {subject.name}
                </button>
                <span className="text-tiny text-ink-3">{subject.viName}</span>
                {subject.due > 0 && (
                  <Badge tone="accent">{subject.due} đến hạn</Badge>
                )}
                <span className="ml-auto shrink-0 text-tiny tabular-nums text-ink-3">
                  {subject.attempted}/{subject.total} ·{" "}
                  {Math.round(subject.progress * 100)}%
                </span>
              </div>
              <StatusBar counts={subject.counts} />
            </div>
          ))}
        </div>
      </Panel>

      {/* ---- Đã làm gần đây ---- */}
      <Panel>
        <PanelHead
          icon={History}
          eyebrow="Ba ngày gần nhất"
          title="Đã làm gần đây"
          hint="Bài làm sai xếp lên trước — đó là thứ cần nhìn lại."
        />

        {activity.length === 0 ? (
          <p className="rounded-row bg-sunken px-3 py-6 text-center text-small text-ink-3">
            Chưa chấm bài nào trong ba ngày qua. Làm vài bài là hiện ngay ở đây.
          </p>
        ) : (
          activity.map((day) => (
            <div key={day.date} className="mb-1 last:mb-0">
              <div className="flex items-center gap-2 px-3 pt-3 pb-1">
                <span className="dx-eyebrow" data-testid="day-name">{day.label}</span>
                <span className="text-micro text-ink-4">{day.date}</span>
                <span
                  className="ml-auto flex gap-2"
                  data-testid="day-tally"
                  data-correct={String(day.correct)}
                  data-wrong={String(day.wrong)}
                >
                  <Badge tone="good">
                    <Ic i={Check} className="h-3 w-3" strokeWidth={2.5} />
                    {day.correct}
                  </Badge>
                  <Badge tone="bad">
                    <Ic i={X} className="h-3 w-3" strokeWidth={2.5} />
                    {day.wrong}
                  </Badge>
                </span>
              </div>
              {day.entries.map((entry) => (
                <Row
                  key={entry.item.id}
                  data-testid="log-row"
                  data-result={entry.result}
                  onClick={() => onOpenTopic(entry.item.subject, entry.item.topic)}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{
                      background:
                        entry.result === "correct"
                          ? "var(--color-good)"
                          : "var(--color-bad)",
                    }}
                  />
                  <span className="ja min-w-0 flex-1 truncate text-body">
                    {entry.item.name}
                  </span>
                  <span className="hidden shrink-0 text-tiny text-ink-4 sm:block">
                    {topicVi(entry.item.topic) || entry.item.topic}
                  </span>
                  <span className="shrink-0 text-micro tabular-nums text-ink-4">
                    {entry.item.exam} {entry.item.question}
                    {entry.times > 1 && ` · chấm ${entry.times} lần`}
                  </span>
                </Row>
              ))}
            </div>
          ))
        )}
      </Panel>

      {/* ---- Đang yếu ở đâu ---- */}
      <Panel>
        <PanelHead
          icon={Stethoscope}
          eyebrow="Top 5 mỗi môn"
          title="Đang yếu ở đâu"
          hint="Tính gộp cả lượt ôn tập lẫn từng ý trong đề thi thử. Bấm một chủ đề để ôn lại cả chủ đề đó."
        />

        {weakSubjects.length === 0 ? (
          <p className="rounded-row bg-sunken px-3 py-6 text-center text-small text-ink-3">
            Chưa đủ dữ liệu để kết luận chỗ nào yếu. Một chủ đề phải có ít nhất{" "}
            {MIN_ATTEMPTS} lượt chấm mới được xếp hạng — làm đúng một bài rồi sai một
            bài thì con số 50% chẳng nói lên điều gì.
          </p>
        ) : (
          <div className="dx-grid grid-cols-1 gap-x-6 gap-y-5 xl:grid-cols-2">
            {weakSubjects.map((subject) => (
              <div key={subject.key} data-testid="weak-subject">
                <div className="mb-1.5 flex items-center gap-2 px-3">
                  <span className="ja text-body font-semibold">
                    {subjectName(subject.key)}
                  </span>
                  <span className="text-tiny text-ink-3">
                    {subjectViName(subject.key)}
                  </span>
                </div>
                {weak[subject.key].map((row) => (
                  <Row
                    key={row.topic}
                    data-testid="weak-row"
                    onClick={() => onOpenTopic(row.subject, row.topic)}
                  >
                    <span
                      className="ja min-w-0 flex-1 truncate text-small"
                      data-testid="weak-topic"
                    >
                      {row.topic}
                    </span>
                    <span className="hidden w-20 shrink-0 sm:block">
                      <Meter value={row.ratio} tone="accent" />
                    </span>
                    <span className="w-10 shrink-0 text-right text-small font-semibold tabular-nums text-accent">
                      {Math.round(row.ratio * 100)}%
                    </span>
                    <span className="shrink-0 text-right text-micro tabular-nums text-ink-4">
                      sai {row.wrong}/{row.attempts}
                      {row.fromExam > 0 && ` · ${row.fromExam} ý từ thi thử`}
                    </span>
                  </Row>
                ))}
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* ---- Hai biểu đồ ---- */}
      <div className="dx-grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHead icon={TrendingUp} eyebrow="12 tuần" title="Số lượt ôn mỗi tuần" />
          {weeks.some((week) => week.reviewed > 0) ? (
            <>
              <Columns
                bars={weeks.map((week) => [
                  { ratio: week.wrong / maxWeek, tone: "var(--color-bad)" },
                  { ratio: week.correct / maxWeek, tone: "var(--color-good)" },
                ])}
                labels={weeks.map((week) => week.label)}
              />
              <div className="mt-3">
                <Legend
                  items={[
                    { tone: "var(--color-good)", text: "Đúng" },
                    { tone: "var(--color-bad)", text: "Sai" },
                  ]}
                />
              </div>
            </>
          ) : (
            <p className="rounded-row bg-sunken px-3 py-6 text-center text-small text-ink-3">
              Chưa có dữ liệu. Ôn vài bài là biểu đồ hiện lên ngay.
            </p>
          )}
        </Panel>

        <Panel>
          <PanelHead icon={CalendarDays} eyebrow="14 ngày tới" title="Lịch ôn sắp tới" />
          <Columns
            bars={upcoming.map((day, index) => [
              {
                ratio: day.count / maxUpcoming,
                tone: index === 0 ? "var(--color-accent)" : "var(--color-info)",
              },
            ])}
            labels={upcoming.map((day, index) =>
              index === 0 ? "nay" : day.date.slice(8),
            )}
          />
          <p className="mt-3 text-tiny text-ink-4">
            Biết trước ngày nào nặng để sắp xếp thời gian.
          </p>
        </Panel>
      </div>

      {/* ---- Lịch nhiệt 17 tuần ---- */}
      <Panel>
        <PanelHead
          icon={CalendarClock}
          eyebrow="17 tuần qua"
          title="Nhịp học"
          hint="Ô càng sáng là ngày đó học càng nhiều."
        />
        {/* Ghim cả bề rộng cột lẫn chiều cao hàng. Chỉ đặt số hàng thôi thì lưới
            giãn cột ra cho đầy khối, mỗi ô thành một hình vuông to tướng. */}
        <div
          className="dx-grid grid-flow-col justify-start gap-[3px] overflow-x-auto pb-1"
          style={{
            gridTemplateRows: "repeat(7, 11px)",
            gridAutoColumns: "11px",
          }}
        >
          {heat.map((day) => {
            const level =
              day.reviewed === 0 ? 0 : Math.min(4, Math.ceil((day.reviewed / maxHeat) * 4));
            return (
              <span
                key={day.date}
                title={`${day.date}: ${day.reviewed} bài`}
                className="h-[11px] w-[11px] rounded-[2px]"
                style={{
                  background:
                    level === 0
                      ? "var(--color-sunken)"
                      : `color-mix(in srgb, var(--color-accent) ${level * 25}%, var(--color-sunken))`,
                }}
              />
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-micro text-ink-4">
          <span>Ít</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <i
              key={level}
              className="block h-2.5 w-2.5 rounded-[2px]"
              style={{
                background:
                  level === 0
                    ? "var(--color-sunken)"
                    : `color-mix(in srgb, var(--color-accent) ${level * 25}%, var(--color-sunken))`,
              }}
            />
          ))}
          <span>Nhiều</span>
        </div>
      </Panel>

      {/* ---- Huy hiệu đã đạt ---- */}
      <Panel>
        <PanelHead
          icon={Award}
          eyebrow="Thành tích"
          title="Huy hiệu đã đạt"
          hint={
            earned.length === 0
              ? "Chưa có huy hiệu nào — cứ học đều, tự khắc mở khoá."
              : `${earned.length} huy hiệu${
                  earnedToday.length > 0 ? ` · ${earnedToday.length} mở hôm nay` : ""
                }`
          }
        />

        {earned.length === 0 ? (
          <p className="rounded-row bg-sunken px-3 py-6 text-center text-small text-ink-3">
            Huy hiệu được giữ kín cho tới lúc bạn chạm mốc. Đang học mà đạt được thì
            app sẽ báo ngay.
          </p>
        ) : (
          <div className="dx-grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {earned.map((badge) => {
              const day = data.badges[badge.id]!;
              const isToday = day === today;
              return (
                <div
                  key={badge.id}
                  title={badge.description}
                  className={`relative rounded-row bg-sunken p-3 text-center ring-[0.5px] ${
                    isToday ? "ring-accent" : "ring-hairline"
                  }`}
                >
                  {isToday && (
                    <span className="absolute right-1.5 top-1.5 rounded-[3px] bg-accent px-1 text-[9px] font-bold text-white">
                      MỚI
                    </span>
                  )}
                  <div className="dx-grid place-items-center text-accent">
                    <badge.icon className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                  <div className="mt-1.5 truncate text-tiny font-medium">
                    {badge.name}
                  </div>
                  <div className="text-micro text-ink-4">
                    {isToday ? "hôm nay" : day}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
