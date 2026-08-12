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

const args = [task, `-PversionName=${version}`, `-PversionCode=${versionCode}`];

// Khoá ký cố định, nếu có. Không có thì Gradle rơi về khoá gỡ lỗi tự sinh —
// cài được nhưng đăng nhập Google sẽ hỏng, xem docs/DONG-BO-GOOGLE-DRIVE.md.
const keystore = process.env.DENKEN_KEYSTORE;
if (keystore) {
  args.push(
    `-PDENKEN_KEYSTORE=${path.resolve(keystore)}`,
    `-PDENKEN_STORE_PASSWORD=${process.env.DENKEN_STORE_PASSWORD ?? ""}`,
    `-PDENKEN_KEY_ALIAS=${process.env.DENKEN_KEY_ALIAS ?? "denken"}`,
    `-PDENKEN_KEY_PASSWORD=${process.env.DENKEN_KEY_PASSWORD ?? ""}`,
  );
  console.log("Ký bằng khoá cố định:", path.basename(keystore));
} else {
  console.log("Chưa có khoá cố định — ký bằng khoá gỡ lỗi (đăng nhập Google sẽ không dùng được).");
}

const result = spawnSync(
  process.platform === "win32" ? "gradlew.bat" : "./gradlew",
  args,
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
