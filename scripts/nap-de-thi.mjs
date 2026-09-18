#!/usr/bin/env node
/**
 * Nạp đề thi PDF vào app.
 *
 *     node scripts/nap-de-thi.mjs          # nạp
 *     node scripts/nap-de-thi.mjs --thu    # chỉ soát tên, không chép
 *
 * Bỏ file PDF vào thư mục `de-thi/` ở gốc dự án, đặt tên theo đúng mã của
 * denken-ou: `{môn}{mã kỳ}.pdf`.
 *
 *     de-thi/rironr8-1.pdf     理論 令和8年度上期
 *     de-thi/kikaih22.pdf      機械 平成22年度
 *
 * Script này làm ba việc:
 *
 *   1. **Soát tên.** Tên nào không ứng với một cặp (kỳ thi, môn) có thật trong
 *      danh mục thì báo ra và KHÔNG nạp. Đặt sai tên mà cứ nạp thì app coi như
 *      kỳ đó có đề, bấm vào ra file của kỳ khác — sai kiểu khó thấy nhất.
 *   2. **Chép sang `public/de-thi/`** để Vite gói vào bản build, nhờ đó APK
 *      Android mang theo đề. Bản máy tính thì đọc thẳng từ `de-thi/` qua
 *      `extraResources`, không cần chép.
 *   3. **Ghi `src/data/de-thi.json`** — danh sách đề đi kèm bản build. Android
 *      cần file này vì không `readdir` được assets trong APK.
 *
 * Vì sao không nhét PDF vào chính danh mục
 * ----------------------------------------
 * Danh mục `catalog.json` là dữ liệu, còn "máy này có file nào" là chuyện của
 * từng máy: bản máy tính có thể có đủ 100 đề trong khi điện thoại chỉ mang vài
 * kỳ gần nhất. Nên app hỏi nền tảng (`platform.deThiCo()`) chứ không tra danh
 * mục, và mỗi máy tự trả lời theo đúng thứ nó có.
 */

import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(import.meta.dirname, "..");
const NGUON = path.join(ROOT, "de-thi");
const PUBLIC = path.join(ROOT, "public", "de-thi");
const DANH_SACH = path.join(ROOT, "src", "data", "de-thi.json");

const thu = process.argv.includes("--thu");

/* Dựng bộ tên hợp lệ từ chính danh mục — cùng công thức mà lib/de-thi.ts dùng,
   nên hai bên không thể lệch nhau. */
const catalog = JSON.parse(readFileSync(path.join(ROOT, "src", "data", "catalog.json"), "utf8"));
const MON = ["riron", "denryoku", "kikai", "houki"];

const maKy = new Map();
for (const bai of catalog.items) {
  const slug = /denken-ou\.com\/([^/]+)/.exec(bai.url)?.[1];
  if (!slug) continue;
  const goc = slug.replace(/-\d+$/, "");
  if (!goc.startsWith(bai.subject)) continue; // link sai môn: bỏ qua
  const ma = goc.slice(bai.subject.length);
  if (!ma) continue;
  const dem = maKy.get(bai.exam) ?? new Map();
  dem.set(ma, (dem.get(ma) ?? 0) + 1);
  maKy.set(bai.exam, dem);
}

const hopLe = new Map(); // tên file -> "kỳ / môn"
for (const [ky, dem] of maKy) {
  const [ma] = [...dem.entries()].sort((a, b) => b[1] - a[1])[0];
  for (const mon of MON) hopLe.set(`${mon}${ma}.pdf`, `${ky} ${mon}`);
}

/* Đọc thư mục nguồn. */
let coGi = [];
try {
  coGi = readdirSync(NGUON).filter((n) => n.toLowerCase().endsWith(".pdf"));
} catch {
  mkdirSync(NGUON, { recursive: true });
}

const nhan = [];
const la = [];
for (const ten of coGi) {
  if (hopLe.has(ten)) nhan.push(ten);
  else la.push(ten);
}
nhan.sort();

const MB = (b) => (b / 1024 / 1024).toFixed(1);
let tong = 0;
for (const ten of nhan) tong += statSync(path.join(NGUON, ten)).size;

console.log(`Đề hợp lệ: ${nhan.length}/${hopLe.size} cặp (kỳ, môn) — ${MB(tong)} MB`);
if (la.length) {
  console.log(`\nKHÔNG nạp ${la.length} file vì tên không ứng với kỳ thi nào:`);
  for (const ten of la) console.log(`  ${ten}`);
  console.log("\nTên phải là {môn}{mã kỳ}.pdf, ví dụ: rironr8-1.pdf, kikaih22.pdf");
  console.log("Xem đủ bộ tên hợp lệ:  node scripts/nap-de-thi.mjs --ten");
}
if (process.argv.includes("--ten")) {
  console.log("\nBộ tên hợp lệ:");
  for (const [ten, mo] of [...hopLe].sort()) {
    console.log(`  ${ten.padEnd(22)} ${mo}${nhan.includes(ten) ? "  [đã có]" : ""}`);
  }
}

if (thu) {
  console.log("\n(--thu: chưa chép gì cả)");
  process.exit(la.length ? 1 : 0);
}

/* Chép sang public/ cho Vite gói vào bản build. */
rmSync(PUBLIC, { recursive: true, force: true });
mkdirSync(PUBLIC, { recursive: true });
for (const ten of nhan) copyFileSync(path.join(NGUON, ten), path.join(PUBLIC, ten));

/* Ghi danh sách. Kèm vân tay để biết bản build nào mang bộ đề nào. */
const vanTay = createHash("sha256").update(nhan.join("|")).digest("hex").slice(0, 12);
writeFileSync(
  DANH_SACH,
  JSON.stringify({ generatedAt: new Date().toISOString(), fingerprint: vanTay, files: nhan }, null, 2) + "\n",
  "utf8",
);
console.log(`\nĐã chép ${nhan.length} đề sang public/de-thi/ và ghi src/data/de-thi.json`);
if (nhan.length === 0) {
  console.log("Chưa có đề nào — app sẽ dùng link denken-ou.com như trước.");
}
