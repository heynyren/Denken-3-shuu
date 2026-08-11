/**
 * Tầng trạng thái của giao diện.
 *
 * Nguyên tắc: mọi thay đổi đi qua `update()`. Hàm này nhận dữ liệu cũ, trả về
 * dữ liệu mới, rồi tự động chấm huy hiệu và hẹn giờ ghi xuống đĩa.
 * Nhờ vậy không có đường nào sửa được dữ liệu mà quên lưu.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { newlyEarned } from "../lib/badges";
import { itemById } from "../lib/catalog";
import { applyReview, emptyProgress, todayISO } from "../lib/srs";
import { computeOverview } from "../lib/stats";
import type {
  AppData,
  ItemProgress,
  ItemStatus,
  Settings,
  StoreInfo,
} from "../lib/types";

/** Chờ 600ms sau thao tác cuối mới ghi, tránh ghi đĩa liên tục khi gõ ghi chú. */
const SAVE_DELAY_MS = 600;

export type SaveState = "idle" | "pending" | "saving" | "saved" | "error";

export interface Store {
  data: AppData | null;
  info: StoreInfo | null;
  loading: boolean;
  error: string | null;
  saveState: SaveState;
  /** Huy hiệu vừa mở khoá, để hiện thông báo chúc mừng. */
  justEarned: string[];
  clearJustEarned(): void;

  review(id: string, result: "correct" | "wrong"): void;
  setNote(id: string, note: string): void;
  setRefLink(id: string, refLink: string): void;
  setStatus(id: string, status: ItemStatus): void;
  resetItem(id: string): void;
  snooze(id: string, days: number): void;

  updateSettings(patch: Partial<Settings>): void;

  reload(): Promise<void>;
  replaceAll(data: AppData): void;
  flush(): Promise<void>;
}

function withProgress(
  data: AppData,
  id: string,
  change: (current: ItemProgress) => ItemProgress,
): AppData {
  const current = data.progress[id] ?? emptyProgress();
  return { ...data, progress: { ...data.progress, [id]: change(current) } };
}

export function useStore(): Store {
  const [data, setData] = useState<AppData | null>(null);
  const [info, setInfo] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [justEarned, setJustEarned] = useState<string[]>([]);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<AppData | null>(null);
  const loadedOnce = useRef(false);

  /* ---------------- ghi xuống đĩa ---------------- */

  const writeNow = useCallback(async () => {
    const snapshot = pending.current;
    if (!snapshot) return;
    pending.current = null;
    setSaveState("saving");
    try {
      const result = await window.denken.save(snapshot);
      setSaveState(result.ok ? "saved" : "error");
      if (!result.ok) setError(result.error ?? "Không ghi được dữ liệu.");
    } catch (cause) {
      setSaveState("error");
      setError((cause as Error).message);
    }
  }, []);

  const scheduleSave = useCallback(
    (next: AppData) => {
      pending.current = next;
      setSaveState("pending");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void writeNow(), SAVE_DELAY_MS);
    },
    [writeNow],
  );

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    await writeNow();
  }, [writeNow]);

  /* ---------------- cửa duy nhất để đổi dữ liệu ---------------- */

  const update = useCallback(
    (change: (current: AppData) => AppData) => {
      setData((current) => {
        if (!current) return current;
        const next = change(current);

        // Chấm huy hiệu ngay trên dữ liệu mới, huy hiệu cũ không bao giờ bị gỡ.
        const fresh = newlyEarned(computeOverview(next), next, todayISO());
        const withBadges =
          Object.keys(fresh).length > 0
            ? { ...next, badges: { ...next.badges, ...fresh } }
            : next;

        if (Object.keys(fresh).length > 0) {
          setJustEarned((seen) => [...seen, ...Object.keys(fresh)]);
        }
        scheduleSave(withBadges);
        return withBadges;
      });
    },
    [scheduleSave],
  );

  /* ---------------- nạp lần đầu ---------------- */

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [loaded, storeInfo] = await Promise.all([
        window.denken.load(),
        window.denken.info(),
      ]);
      setData(loaded);
      setInfo(storeInfo);
      setError(null);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loadedOnce.current) return; // React StrictMode gọi effect hai lần
    loadedOnce.current = true;
    void reload();
  }, [reload]);

  // Đóng cửa sổ khi còn thay đổi chưa ghi thì ghi nốt.
  useEffect(() => {
    const onLeave = () => {
      if (pending.current) void writeNow();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [writeNow]);

  /* ---------------- các hành động ---------------- */

  const review = useCallback(
    (id: string, result: "correct" | "wrong") => {
      update((current) => {
        const today = todayISO();
        const item = itemById.get(id);
        const next = withProgress(current, id, (progress) =>
          applyReview(progress, result, today),
        );

        const log = current.dailyLog[today] ?? {
          reviewed: 0,
          correct: 0,
          wrong: 0,
          bySubject: {},
        };
        const subject = item?.subject;

        return {
          ...next,
          dailyLog: {
            ...next.dailyLog,
            [today]: {
              reviewed: log.reviewed + 1,
              correct: log.correct + (result === "correct" ? 1 : 0),
              wrong: log.wrong + (result === "wrong" ? 1 : 0),
              bySubject: subject
                ? { ...log.bySubject, [subject]: (log.bySubject[subject] ?? 0) + 1 }
                : log.bySubject,
            },
          },
        };
      });
    },
    [update],
  );

  const setNote = useCallback(
    (id: string, note: string) =>
      update((current) => withProgress(current, id, (p) => ({ ...p, note }))),
    [update],
  );

  const setRefLink = useCallback(
    (id: string, refLink: string) =>
      update((current) => withProgress(current, id, (p) => ({ ...p, refLink }))),
    [update],
  );

  const setStatus = useCallback(
    (id: string, status: ItemStatus) =>
      update((current) => withProgress(current, id, (p) => ({ ...p, status }))),
    [update],
  );

  const resetItem = useCallback(
    (id: string) =>
      update((current) =>
        withProgress(current, id, (p) => ({
          ...emptyProgress(),
          // Giữ lại công sức đã bỏ ra: ghi chú và link tham khảo không xoá.
          note: p.note,
          refLink: p.refLink,
        })),
      ),
    [update],
  );

  const snooze = useCallback(
    (id: string, days: number) =>
      update((current) => {
        const today = todayISO();
        return withProgress(current, id, (p) => {
          const base = p.nextReview && p.nextReview > today ? p.nextReview : today;
          const date = new Date(base);
          date.setDate(date.getDate() + days);
          return { ...p, nextReview: date.toISOString().slice(0, 10) };
        });
      }),
    [update],
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) =>
      update((current) => ({ ...current, settings: { ...current.settings, ...patch } })),
    [update],
  );

  const replaceAll = useCallback(
    (incoming: AppData) => {
      setData(incoming);
      scheduleSave(incoming);
    },
    [scheduleSave],
  );

  const clearJustEarned = useCallback(() => setJustEarned([]), []);

  return {
    data,
    info,
    loading,
    error,
    saveState,
    justEarned,
    clearJustEarned,
    review,
    setNote,
    setRefLink,
    setStatus,
    resetItem,
    snooze,
    updateSettings,
    reload,
    replaceAll,
    flush,
  };
}
