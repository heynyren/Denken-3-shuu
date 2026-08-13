/**
 * Soát tên lớp bị trùng giữa hệ thiết kế mới và CSS cũ.
 *
 * theme.css xếp Tailwind vào tầng, còn styles.css để ngoài tầng — theo luật CSS
 * thì style ngoài tầng luôn thắng. Nghĩa là ở màn hình mới, lớp Tailwind nào
 * trùng tên với một lớp trong styles.css sẽ **không có tác dụng**, im lặng.
 *
 * Script này quét các lớp thật sự dùng trong màn mới rồi đối chiếu, để phát hiện
 * sớm thay vì ngồi dò tại sao `p-4` không ăn.
 *
 * Chạy: node scripts/soat-trung-lop.mjs
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/**
 * Chỉ tính lớp được định nghĩa TRẦN trong styles.css, ví dụ `.grid { … }`.
 * Lớp ghép như `.btn.block` không chặn được lớp `block` đứng một mình, vì độ ưu
 * tiên của nó đòi phải có cả `.btn`.
 */
const css = readFileSync(path.join(root, "src/styles.css"), "utf8");
const cu = new Set();
for (const m of css.matchAll(/(^|[\s,>+~])\.(-?[_a-zA-Z][\w-]*)\s*(?=[,{])/gm)) {
  cu.add(m[2]);
}

/** Lớp của bản cũ mà màn mới CỐ Ý dùng lại, không phải trùng nhầm. */
const CO_Y = new Set([
  "container", // khung trang: rộng tối đa 1080px, xếp dọc, cách nhau 16px
  "ja",        // font tiếng Nhật, để kanji không bị thay bằng glyph Trung
]);

/** Các file đã chuyển sang hệ thiết kế mới. */
const MOI = ["src/views/Dashboard.tsx", "src/components/ui"];

function liet(p) {
  const full = path.join(root, p);
  if (statSync(full).isDirectory()) {
    return readdirSync(full).flatMap((f) => liet(path.join(p, f)));
  }
  return /\.(tsx|ts)$/.test(full) ? [full] : [];
}

const dung = new Set();
for (const file of MOI.flatMap(liet)) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\}|\{cn\(([\s\S]*?)\)\})/g)) {
    for (const token of (m[1] ?? m[2] ?? m[3] ?? "").split(/[\s"'`,+]+/)) {
      const name = token.replace(/^\$\{.*$/, "").trim();
      // Bỏ biến thể (hover:, lg:) để so phần tên lớp gốc.
      const base = name.split(":").pop() ?? "";
      if (/^[a-z][\w-]*$/.test(base)) dung.add(base);
    }
  }
}

const trung = [...dung].filter((name) => cu.has(name) && !CO_Y.has(name)).sort();

if (trung.length === 0) {
  console.log(`Đã soát ${dung.size} lớp ở màn mới — không lớp nào bị CSS cũ chặn.`);
} else {
  console.log(`CẢNH BÁO: ${trung.length} lớp bị styles.css chặn, sẽ không có tác dụng:`);
  for (const name of trung) console.log("  ." + name);
  process.exitCode = 1;
}
