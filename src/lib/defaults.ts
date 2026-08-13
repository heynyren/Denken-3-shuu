/**
 * Hình dạng gốc của dữ liệu, dùng chung cho mọi nền tảng.
 *
 * Trước đây phiên bản schema và bộ cài đặt mặc định nằm trong `electron/store.ts`.
 * Android không chạy được file đó, mà chép sang một bản thứ hai thì sớm muộn hai
 * bên lệch nhau — lệch phiên bản schema là hỏng đường di trú dữ liệu. Nên đưa về
 * đây, cả hai bên cùng nhập từ một chỗ.
 */

import type { AppData, Settings } from "./types";

// v2 bỏ phần từ vựng/Quizlet.
// v3 đổi một ghi chú/một link thành danh sách nhiều ghi chú và nhiều link.
// v4 thêm lịch sử thi thử.
// v5 mỗi lượt thi lưu thêm bài làm từng câu (scores[].answers).
// v6 thêm dấu sao do người dùng tự đánh (progress[].starred).
export const SCHEMA_VERSION = 6;

export const DEFAULT_SETTINGS: Settings = {
  dailyGoal: 30,
  examDate: "2027-03-21",
  backupsToKeep: 30,
  mirrorDir: "",
};

/** Sổ trắng cho lần chạy đầu tiên. */
export function emptyAppData(): AppData {
  const now = new Date().toISOString();
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    settings: { ...DEFAULT_SETTINGS },
    progress: {},
    dailyLog: {},
    badges: {},
    examResults: [],
  };
}
