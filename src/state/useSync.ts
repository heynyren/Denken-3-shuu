/**
 * Đồng bộ tự động chạy nền.
 *
 * Chạy vào bốn lúc, chọn theo cách người ta thật sự dùng app chứ không phải
 * theo nhịp cho đẹp:
 *
 *   - Ngay khi mở app     — đang ngồi máy tính, muốn thấy phần đã làm trên điện
 *                           thoại tối qua.
 *   - Khi quay lại app    — cầm điện thoại lên là có bản mới nhất.
 *   - Mỗi 5 phút          — kể cả khi máy này không sửa gì, vì máy kia thì có.
 *   - Lúc bấm nút         — không phải chờ ai cả.
 *
 * Không đồng bộ sau mỗi lần chấm một bài: gõ ghi chú mấy chữ là ra chục lần
 * ghi, hạn ngạch GitHub chịu không nổi mà cũng chẳng để làm gì.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import type { SyncConfig, SyncOutcome } from "../lib/cloud";
import {
  BASE_FILE,
  CONFIG_FILE,
  emptySyncConfig,
  readSyncConfig,
  syncOnce,
} from "../lib/cloud";
import type { AppData } from "../lib/types";
import { platform } from "../platform";
import type { Store } from "./useStore";

/** Nhịp chạy nền. */
const EVERY_MS = 5 * 60 * 1000;
/** Khoảng nghỉ tối thiểu giữa hai lần chạy do quay lại app. */
const COOLDOWN_MS = 60 * 1000;

export type SyncState = "off" | "idle" | "running" | "done" | "error";

export interface Sync {
  config: SyncConfig;
  state: SyncState;
  /** Câu báo lần chạy gần nhất, hiện dưới nút. */
  note: string;
  /** Đã nạp xong cấu hình từ đĩa chưa — trước đó đừng vẽ form với giá trị rỗng. */
  ready: boolean;
  saveConfig(patch: Partial<SyncConfig>): Promise<void>;
  /** Chạy một lượt ngay. `manual` chỉ để quyết định có báo "đã giống nhau" không. */
  run(manual?: boolean): Promise<void>;
}

/** Tên máy cho lời nhắn commit, để nhìn lịch sử biết bản nào từ đâu. */
function deviceName(): string {
  return platform.kind === "android" ? "điện thoại" : "máy tính";
}

export function useSync(store: Store): Sync {
  const [config, setConfig] = useState<SyncConfig>(emptySyncConfig());
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<SyncState>("off");
  const [note, setNote] = useState("");

  /* Giữ trong ref để hàm chạy nền luôn thấy bản mới nhất, không kẹt ở lần
     render cũ — cùng lý do với submitRef bên màn thi thử. */
  const configRef = useRef(config);
  configRef.current = config;
  const dataRef = useRef<AppData | null>(store.data);
  dataRef.current = store.data;
  /** Đang chạy một lượt rồi thì thôi, hai lượt chồng nhau là gọi API hai lần vô ích. */
  const busy = useRef(false);
  /** Mốc lần chạy gần nhất, để lần chạy tự động không dồn dập. */
  const lastRun = useRef(0);

  /* --- nạp cấu hình --- */
  useEffect(() => {
    let bỏ = false;
    void (async () => {
      const text = await platform.sideRead(CONFIG_FILE);
      if (bỏ) return;
      const loaded = readSyncConfig(text);
      setConfig(loaded);
      setState(loaded.enabled ? "idle" : "off");
      setReady(true);
    })();
    return () => {
      bỏ = true;
    };
  }, []);

  const saveConfig = useCallback(async (patch: Partial<SyncConfig>) => {
    const next = { ...configRef.current, ...patch };
    configRef.current = next;
    setConfig(next);
    setState(next.enabled ? "idle" : "off");
    await platform.sideWrite(CONFIG_FILE, JSON.stringify(next));
  }, []);

  const run = useCallback(
    async (manual = false) => {
      const current = configRef.current;
      const local = dataRef.current;
      if (!current.enabled || !current.repo || !current.token || !local) return;
      if (busy.current) return;

      busy.current = true;
      lastRun.current = Date.now();
      setState("running");
      try {
        // Ghi nốt phần đang chờ, để bản đẩy lên là bản mới nhất thật.
        await store.flush();
        const outcome: SyncOutcome = await syncOnce({
          config: current,
          local: dataRef.current ?? local,
          readBase: () => platform.sideRead(BASE_FILE),
          writeBase: async (text) => {
            await platform.sideWrite(BASE_FILE, text);
          },
          doFetch: (url, init) => fetch(url, init),
          device: deviceName(),
        });

        if (outcome.changed) store.replaceAll(outcome.data);

        const stamp = new Date().toISOString();
        configRef.current = { ...current, lastSyncAt: stamp };
        setConfig(configRef.current);
        await platform.sideWrite(CONFIG_FILE, JSON.stringify(configRef.current));

        setState("done");
        // Chạy nền mà hai bên giống nhau thì im lặng, đừng nhấp nháy vô cớ.
        if (manual || outcome.changed || outcome.pushed) setNote(outcome.note);
      } catch (cause) {
        setState("error");
        setNote((cause as Error).message || "Đồng bộ không thành công.");
      } finally {
        busy.current = false;
      }
    },
    [store],
  );

  /* --- lúc mở app --- */
  const đãChạyĐầu = useRef(false);
  useEffect(() => {
    if (!ready || đãChạyĐầu.current || !store.data) return;
    if (!config.enabled) return;
    đãChạyĐầu.current = true;
    void run();
  }, [ready, config.enabled, store.data, run]);

  /* --- nhịp 5 phút --- */
  useEffect(() => {
    if (!config.enabled) return;
    const id = setInterval(() => void run(), EVERY_MS);
    return () => clearInterval(id);
  }, [config.enabled, run]);

  /* --- quay lại app --- */
  useEffect(() => {
    if (!config.enabled) return;
    const quayLai = () => {
      // Chuyển qua chuyển lại cửa sổ liên tục thì đừng gọi API mỗi lần.
      if (!document.hidden && Date.now() - lastRun.current > COOLDOWN_MS) void run();
    };
    document.addEventListener("visibilitychange", quayLai);
    window.addEventListener("focus", quayLai);
    return () => {
      document.removeEventListener("visibilitychange", quayLai);
      window.removeEventListener("focus", quayLai);
    };
  }, [config.enabled, run]);

  return { config, state, note, ready, saveConfig, run };
}
