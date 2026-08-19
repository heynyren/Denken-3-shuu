/**
 * Đồng hồ làm bài.
 *
 * Bấm Space (hoặc nút mở bài) là đồng hồ chạy, đếm ngược đúng số phút quy cho
 * loại câu đó. Hết giờ thì chuông reo cho tới khi bạn bấm tắt.
 *
 * Đếm giờ dựa trên mốc thời gian thật (`Date.now()`) chứ không cộng dồn mỗi
 * nhịp setInterval: trình duyệt hãm nhịp khi cửa sổ chạy nền, cộng dồn sẽ khiến
 * đồng hồ chạy chậm dần đúng lúc bạn đang mở tab denken-ou để làm bài.
 */

import { BellOff, Pause, Play, RotateCcw, Timer as TimerIcon, X } from "lucide-react";
import { Ic } from "./ui/icon";
import { useCallback, useEffect, useRef, useState } from "react";

import { createAlarm } from "../lib/alarm";
import { formatClock, partLabel, secondsFor } from "../lib/timing";
import type { CatalogItem } from "../lib/types";
import { platform } from "../platform";
import { ALARM_REVIEW } from "../platform/types";
import { Ring } from "./ui";

import { t } from "../lib/chu";
export interface TimerHandle {
  start(): void;
  stop(): void;
}

export function useCountdown(item: CatalogItem | undefined) {
  const total = item ? secondsFor(item) : 0;
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [pausedLeft, setPausedLeft] = useState<number | null>(null);
  const [left, setLeft] = useState(total);
  const [expired, setExpired] = useState(false);
  const alarm = useRef(createAlarm());

  const running = endsAt !== null;

  /**
   * Hẹn lời nhắc ở tầng hệ điều hành song song với chuông trong app.
   *
   * Chuông trong app chỉ kêu khi app còn được cấp nhịp chạy. Mà bấm mở bài là
   * nhảy sang trình duyệt: trên điện thoại app xuống nền, Android hãm hết
   * setInterval, và bạn ngồi làm bài quá giờ mà không hay. Lời nhắc do hệ điều
   * hành giữ thì nổ đúng giờ kể cả khi màn hình đã tắt.
   */
  const schedule = useCallback((at: number) => {
    void platform.notifyAt(
      ALARM_REVIEW,
      at,
      t("Hết giờ làm bài"),
      t("Chốt đáp án rồi chấm đúng/sai nhé."),
    );
  }, []);

  const unschedule = useCallback(() => {
    void platform.cancelNotify(ALARM_REVIEW);
  }, []);

  const stop = useCallback(() => {
    alarm.current.stop();
    unschedule();
    setEndsAt(null);
    setPausedLeft(null);
    setExpired(false);
  }, [unschedule]);

  const start = useCallback(() => {
    if (!item) return;
    alarm.current.stop();
    setExpired(false);
    setPausedLeft(null);
    const at = Date.now() + secondsFor(item) * 1000;
    setEndsAt(at);
    schedule(at);
  }, [item, schedule]);

  const pause = useCallback(() => {
    if (endsAt === null) return;
    setPausedLeft(Math.max(0, Math.round((endsAt - Date.now()) / 1000)));
    setEndsAt(null);
    unschedule();
  }, [endsAt, unschedule]);

  const resume = useCallback(() => {
    if (pausedLeft === null) return;
    const at = Date.now() + pausedLeft * 1000;
    setEndsAt(at);
    setPausedLeft(null);
    schedule(at);
  }, [pausedLeft, schedule]);

  const dismiss = useCallback(() => {
    alarm.current.stop();
    unschedule();
    setExpired(false);
  }, [unschedule]);

  // Đổi sang bài khác thì bỏ đồng hồ cũ, kể cả khi chuông đang reo.
  useEffect(() => {
    stop();
    setLeft(item ? secondsFor(item) : 0);
  }, [item, stop]);

  useEffect(() => {
    if (endsAt === null) {
      if (pausedLeft !== null) setLeft(pausedLeft);
      return;
    }
    const tick = () => {
      const remain = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setLeft(remain);
      if (remain === 0) {
        setEndsAt(null);
        setExpired(true);
        alarm.current.start();
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endsAt, pausedLeft]);

  // Đóng cửa sổ hay rời màn hình mà chuông còn reo thì phải tắt tiếng.
  const alarmRef = alarm.current;
  useEffect(() => () => alarmRef.stop(), [alarmRef]);

  return {
    total,
    left,
    running,
    paused: pausedLeft !== null,
    expired,
    start,
    stop,
    pause,
    resume,
    dismiss,
  };
}

export type Countdown = ReturnType<typeof useCountdown>;

export default function Timer({
  item,
  clock,
}: {
  item: CatalogItem;
  clock: Countdown;
}) {
  const ratio = clock.total > 0 ? clock.left / clock.total : 0;
  // Còn dưới một phút thì chuyển đỏ để nhìn là biết phải chốt đáp án.
  const color = clock.expired
    ? "var(--red)"
    : clock.left <= 60
      ? "var(--amber)"
      : "var(--blue)";

  if (!clock.running && !clock.paused && !clock.expired) {
    return (
      <div className="timer-idle">
        <span className="small dim">
          <Ic i={TimerIcon} className="h-3.5 w-3.5" /> {partLabel(item)}
        </span>
        <button className="btn sm" onClick={clock.start}>
          {t("Bắt đầu tính giờ")}
        </button>
        <span className="field-hint">
          {t("Bấm")} <span className="mono">Space</span> {t("để mở bài là đồng hồ tự chạy.")}
        </span>
      </div>
    );
  }

  return (
    <div className={`timer-card${clock.expired ? " expired" : ""}`}>
      <Ring ratio={ratio} size={96} width={9} color={color}>
        <div>
          <div className="timer-value" style={{ color }}>
            {clock.expired ? "0:00" : formatClock(clock.left)}
          </div>
        </div>
      </Ring>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700 }}>
          {clock.expired
            ? t("Hết giờ rồi!")
            : clock.paused
              ? t("Đang tạm dừng")
              : t("Đang tính giờ")}
        </div>
        <div className="small muted" style={{ marginTop: 2 }}>
          {partLabel(item)}
          {clock.expired && t(" — chốt đáp án và chấm kết quả nhé")}
        </div>

        <div className="btn-row" style={{ marginTop: 10 }}>
          {clock.expired ? (
            <button className="btn danger" onClick={clock.dismiss}>
              <Ic i={BellOff} /> {t("Tắt chuông")}
            </button>
          ) : clock.paused ? (
            <button className="btn sm primary" onClick={clock.resume}>
              <Ic i={Play} /> {t("Tiếp tục")}
            </button>
          ) : (
            <button className="btn sm" onClick={clock.pause}>
              <Ic i={Pause} /> {t("Tạm dừng")}
            </button>
          )}
          <button className="btn sm ghost" onClick={clock.start}>
            <Ic i={RotateCcw} /> {t("Bắt đầu lại")}
          </button>
          <button className="btn sm ghost" onClick={clock.stop}>
            <Ic i={X} /> {t("Bỏ đồng hồ")}
          </button>
        </div>
      </div>
    </div>
  );
}
