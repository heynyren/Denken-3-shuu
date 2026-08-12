#!/usr/bin/env node
/**
 * Gọi Gradle để đóng gói APK, kèm số hiệu phiên bản lấy từ package.json.
 *
 * Android đòi `versionCode` là một số nguyên tăng dần, không nhận "1.8.0". Quy
 * đổi theo công thức cố định để cứ tăng phiên bản trong package.json là
 * versionCode tự tăng theo, khỏi phải nhớ sửa hai chỗ:
 *
 *     1.8.0  -> 10800
 *     1.8.3  -> 10803
 *     2.0.0  -> 20000
 */

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const { version } = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));

const [major = 0, minor = 0, patch = 0] = version.split(".").map(Number);
const versionCode = major * 10000 + minor * 100 + patch;

const release = process.argv.includes("--release");
const task = release ? "assembleRelease" : "assembleDebug";

console.log(`Đóng gói ${task}: ${version} (versionCode ${versionCode})`);

const result = spawnSync(
  process.platform === "win32" ? "gradlew.bat" : "./gradlew",
  [task, `-PversionName=${version}`, `-PversionCode=${versionCode}`],
  { cwd: path.join(root, "android"), stdio: "inherit" },
);

if (result.error) {
  console.error(
    "Không chạy được Gradle. Máy này cần Java 17+ và Android SDK " +
      "(biến môi trường ANDROID_HOME).",
  );
  process.exit(1);
}
process.exit(result.status ?? 1);
