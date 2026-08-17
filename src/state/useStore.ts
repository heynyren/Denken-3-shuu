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
import { platform } from "../platform";
import type {
  AppData,
  Attachment,
  ExamResult,
  ItemProgress,
  ItemStatus,
  LinkEntry,
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

  addNote(id: string): string;
  setNoteText(id: string, noteId: string, text: string): void;
  removeNote(id: string, noteId: string): void;
  addAttachments(id: string, noteId: string, files: Attachment[]): void;
  removeAttachment(id: string, noteId: string, attachmentId: string): void;

  addLink(id: string, url?: string): void;
  setLink(id: string, linkId: string, patch: Partial<LinkEntry>): void;
  removeLink(id: string, linkId: string): void;
  setStatus(id: string, status: ItemStatus): void;
  resetItem(id: string): void;
  snooze(id: string, days: number): void;
  /** Bật/tắt dấu sao "bài này đáng chú ý". */
  toggleStar(id: string): void;

  updateSettings(patch: Partial<Settings>): void;
  saveExamResult(result: ExamResult): void;
  removeExamResult(id: string): void;

  reload(): Promise<void>;
  replaceAll(data: AppData): void;
  flush(): Promise<void>;
}

/**
 * Cửa duy nhất để sửa tiến độ một bài.
 *
 * Đóng dấu `updatedAt` ngay tại đây, chứ không rải ở từng hành động — chỉ cần
 * một chỗ quên là dữ liệu sau này không gộp được khi đồng bộ.
 */
function withProgress(
  data: AppData,
  id: string,
  change: (current: ItemProgress) => ItemProgress,
): AppData {
  const current = data.progress[id] ?? emptyProgress();
  const next = { ...change(current), updatedAt: new Date().toISOString() };
  return { ...data, progress: { ...data.progress, [id]: next } };
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
      const result = await platform.save(snapshot);
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
        platform.load(),
        platform.info(),
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

  /**
   * Ghi nốt trước khi app biến mất.
   *
   * Ba đường vào, vì mỗi nền tảng chết một kiểu:
   *
   *   - `beforeunload` — đóng cửa sổ trên Windows.
   *   - `pagehide`     — WebView bị dọn; trên di động đây thường là tin cuối cùng
   *                      nhận được, `beforeunload` nhiều khi không nổ.
   *   - `platform.onPause` — app lui về chạy nền trên Android, lúc hệ điều hành
   *                      còn có thể giết nó bất cứ lúc nào mà không báo gì thêm.
   *
   * Thiếu đường thứ ba là bug người dùng đã gặp: chấm một bài rồi vuốt app ra
   * khỏi danh sách gần đây trong vòng 600ms, bài đó không bao giờ xuống đĩa.
   */
  useEffect(() => {
    const ghiNot = () => {
      if (pending.current) void writeNow();
    };
    window.addEventListener("beforeunload", ghiNot);
    window.addEventListener("pagehide", ghiNot);
    const thoi = platform.onPause(ghiNot);
    return () => {
      window.removeEventListener("beforeunload", ghiNot);
      window.removeEventListener("pagehide", ghiNot);
      thoi();
    };
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

  /* ---------------- ghi chú ---------------- */

  // id sinh tại chỗ và trả về ngay, để giao diện mở sẵn ô nhập của ghi chú mới.
  const nextId = useRef(0);
  const makeId = (prefix: string) => {
    nextId.current += 1;
    return `${prefix}-${Date.now().toString(36)}-${nextId.current.toString(36)}`;
  };

  const addNote = useCallback(
    (id: string) => {
      const noteId = makeId("note");
      update((current) =>
        withProgress(current, id, (p) => ({
          ...p,
          notes: [
            ...p.notes,
            { id: noteId, text: "", createdAt: new Date().toISOString(), attachments: [] },
          ],
        })),
      );
      return noteId;
    },
    [update],
  );

  const setNoteText = useCallback(
    (id: string, noteId: string, text: string) =>
      update((current) =>
        withProgress(current, id, (p) => ({
          ...p,
          notes: p.notes.map((note) => (note.id === noteId ? { ...note, text } : note)),
        })),
      ),
    [update],
  );

  const removeNote = useCallback(
    (id: string, noteId: string) =>
      update((current) =>
        withProgress(current, id, (p) => ({
          ...p,
          notes: p.notes.filter((note) => note.id !== noteId),
        })),
      ),
    [update],
  );

  const addAttachments = useCallback(
    (id: string, noteId: string, files: Attachment[]) =>
      update((current) =>
        withProgress(current, id, (p) => ({
          ...p,
          notes: p.notes.map((note) =>
            note.id === noteId
              ? { ...note, attachments: [...note.attachments, ...files] }
              : note,
          ),
        })),
      ),
    [update],
  );

  const removeAttachment = useCallback(
    (id: string, noteId: string, attachmentId: string) =>
      update((current) =>
        withProgress(current, id, (p) => ({
          ...p,
          notes: p.notes.map((note) =>
            note.id === noteId
              ? {
                  ...note,
                  attachments: note.attachments.filter((a) => a.id !== attachmentId),
                }
              : note,
          ),
        })),
      ),
    [update],
  );

  /* ---------------- link tham khảo ---------------- */

  const addLink = useCallback(
    (id: string, url = "") =>
      update((current) =>
        withProgress(current, id, (p) => ({
          ...p,
          links: [...p.links, { id: makeId("link"), url, label: "" }],
        })),
      ),
    [update],
  );

  const setLink = useCallback(
    (id: string, linkId: string, patch: Partial<LinkEntry>) =>
      update((current) =>
        withProgress(current, id, (p) => ({
          ...p,
          links: p.links.map((link) =>
            link.id === linkId ? { ...link, ...patch } : link,
          ),
        })),
      ),
    [update],
  );

  const removeLink = useCallback(
    (id: string, linkId: string) =>
      update((current) =>
        withProgress(current, id, (p) => ({
          ...p,
          links: p.links.filter((link) => link.id !== linkId),
        })),
      ),
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
          notes: p.notes,
          links: p.links,
        })),
      ),
    [update],
  );

  const toggleStar = useCallback(
    (id: string) =>
      update((current) =>
        withProgress(current, id, (p) => ({ ...p, starred: !p.starred })),
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

  const saveExamResult = useCallback(
    (result: ExamResult) =>
      // Giữ 100 lần gần nhất là đủ vẽ tiến bộ mà không phình file.
      update((current) => ({
        ...current,
        examResults: [...current.examResults, result].slice(-100),
      })),
    [update],
  );

  const removeExamResult = useCallback(
    (id: string) =>
      update((current) => ({
        ...current,
        examResults: current.examResults.filter((entry) => entry.id !== id),
      })),
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
    addNote,
    setNoteText,
    removeNote,
    addAttachments,
    removeAttachment,
    addLink,
    setLink,
    removeLink,
    setStatus,
    resetItem,
    snooze,
    toggleStar,
    updateSettings,
    saveExamResult,
    removeExamResult,
    reload,
    replaceAll,
    flush,
  };
}
