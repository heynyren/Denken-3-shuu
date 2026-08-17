#!/usr/bin/env node
/**
 * Tạo khoá ký cố định cho app Android — chạy đúng một lần, dùng mãi về sau.
 *
 * Vì sao cần
 * ----------
 * Android nhận diện app bằng **chữ ký**, không phải bằng tên hay biểu tượng.
 * Muốn cài đè bản mới lên bản cũ thì hai bản phải ký bằng cùng một khoá; khác
 * khoá là hệ điều hành từ chối thẳng ("App not installed"), buộc phải gỡ app cũ
 * đi — mà gỡ app là xoá luôn thư mục dữ liệu, mất sạch tiến độ học.
 *
 * Android Studio ở máy bạn ký bằng `~/.android/debug.keystore`. File đó nằm yên
 * một chỗ, nên bản nào build ra cũng cùng chữ ký, cài đè thoải mái.
 *
 * Máy chạy của GitHub thì mỗi lần build là một máy ảo mới tinh, không có
 * `debug.keystore` nào cả. Gradle tự sinh một cái mới — **khoá mới, chữ ký
 * mới, mỗi lần build một khác**. Đó là lý do APK tải từ GitHub về lần nào cũng
 * bắt gỡ app đi cài lại.
 *
 * Script này tạo một khoá cố định để nạp vào GitHub Secrets. Từ đó mọi bản
 * build đều cùng chữ ký, cập nhật đè bình thường, dữ liệu còn nguyên.
 *
 * Khoá KHÔNG được commit vào repo. Repo này đang để công khai; ai có khoá là
 * ký được app giả mạo cài đè lên app thật của bạn. `.gitignore` đã chặn sẵn,
 * nhưng vẫn nên xoá file đi sau khi dán xong vào Secrets.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { randomBytes } from "node:crypto";

const root = path.resolve(import.meta.dirname, "..");
const dich = path.join(root, "android", "denken.keystore");
const ALIAS = "denken";

// Chế độ dọn: chỉ xoá file khoá khỏi máy, không tạo gì cả.
if (process.argv.includes("--xoa")) {
  if (existsSync(dich)) {
    rmSync(dich);
    console.log(`Đã xoá ${dich} khỏi máy. Nội dung vẫn nằm trong GitHub Secrets.`);
  } else {
    console.log("Không có file khoá nào trên máy — không cần xoá.");
  }
  process.exit(0);
}

if (existsSync(dich)) {
  console.error(
    `Đã có sẵn ${dich}.\n` +
      "Nếu đây là khoá đang dùng thì ĐỪNG tạo lại — tạo khoá mới là mất khả " +
      "năng cập nhật đè lên các bản đã cài.\n" +
      "Thật sự muốn làm lại thì xoá file đó đi rồi chạy lệnh này lần nữa.",
  );
  process.exit(1);
}

/**
 * Tìm `keytool`.
 *
 * Nó đi kèm JDK. Nhưng máy nào có Android Studio thì đã có sẵn một JDK nằm
 * trong thư mục cài đặt của Android Studio (`jbr/`) — chỉ là không nằm trong
 * PATH, nên gõ `keytool` trơn sẽ báo không tìm thấy dù máy có đủ đồ. Bắt người
 * ta đi cài thêm JDK trong tình huống đó là bắt làm việc thừa.
 */
function timKeytool() {
  const ten = process.platform === "win32" ? "keytool.exe" : "keytool";

  // Có sẵn trong PATH là tốt nhất.
  const thu = spawnSync(ten, ["-help"], { stdio: "ignore" });
  if (!thu.error) return ten;

  const noiCoThe = [
    process.env.JAVA_HOME && path.join(process.env.JAVA_HOME, "bin", ten),
    process.env.ANDROID_STUDIO_JDK && path.join(process.env.ANDROID_STUDIO_JDK, "bin", ten),
    // Android Studio, các chỗ cài mặc định.
    "C:/Program Files/Android/Android Studio/jbr/bin/keytool.exe",
    "C:/Program Files/Android/Android Studio/jre/bin/keytool.exe",
    `${process.env.LOCALAPPDATA ?? ""}/Programs/Android Studio/jbr/bin/keytool.exe`,
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/keytool",
    "/Applications/Android Studio.app/Contents/jre/Contents/Home/bin/keytool",
  ].filter(Boolean);

  for (const noi of noiCoThe) {
    if (existsSync(noi)) return noi;
  }
  return null;
}

const KEYTOOL = timKeytool();
if (!KEYTOOL) {
  console.error(
    "Không tìm thấy keytool trên máy này.\n\n" +
      "keytool đi kèm JDK. Ba cách, chọn cách nào cũng được:\n" +
      "  1. Máy có Android Studio thì keytool nằm trong thư mục cài đặt của nó;\n" +
      "     đặt biến JAVA_HOME trỏ vào thư mục `jbr` bên trong rồi chạy lại.\n" +
      "  2. Cài JDK 17 trở lên (adoptium.net), mở lại cửa sổ dòng lệnh.\n" +
      "  3. Hoặc dùng luôn khoá gỡ lỗi sẵn có của Android Studio — xem phần\n" +
      "     'Đường tắt' trong docs/KHOA-KY-ANDROID.md.",
  );
  process.exit(1);
}

/** Mật khẩu ngẫu nhiên: không ai phải nhớ, chỉ dán vào GitHub Secrets. */
const matKhau = randomBytes(24).toString("base64url");

const keytool = spawnSync(
  KEYTOOL,
  [
    "-genkeypair",
    "-v",
    "-keystore", dich,
    "-alias", ALIAS,
    "-keyalg", "RSA",
    "-keysize", "2048",
    // 100 năm. Khoá hết hạn là hết cập nhật đè, không có đường vòng nào cả.
    "-validity", "36500",
    "-storepass", matKhau,
    "-keypass", matKhau,
    "-dname", "CN=Denken 3 Shuu, OU=Personal, O=Denken 3 Shuu, C=JP",
  ],
  { stdio: ["ignore", "ignore", "pipe"] },
);

if (keytool.error || keytool.status !== 0) {
  console.error(
    "Không chạy được keytool. Máy này cần cài Java (JDK 17 trở lên).\n" +
      (keytool.stderr?.toString() ?? keytool.error?.message ?? ""),
  );
  process.exit(1);
}

const b64 = readFileSync(dich).toString("base64");

// Vân tay để đối chiếu về sau, và để khai báo với Google nếu có ngày dùng OAuth.
const vanTay = spawnSync(
  KEYTOOL,
  ["-list", "-v", "-keystore", dich, "-alias", ALIAS, "-storepass", matKhau],
  { encoding: "utf8" },
);
const sha1 = vanTay.stdout?.match(/SHA1:\s*([0-9A-F:]+)/)?.[1] ?? "(không đọc được)";

console.log(`
Xong. Giờ vào GitHub:

    Settings → Secrets and variables → Actions → New repository secret

Tạo đúng bốn secret sau (tên phải viết y hệt):

  ANDROID_KEYSTORE_BASE64
${b64}

  ANDROID_STORE_PASSWORD
${matKhau}

  ANDROID_KEY_ALIAS
${ALIAS}

  ANDROID_KEY_PASSWORD
${matKhau}

Vân tay SHA-1 của khoá này: ${sha1}

Dán xong bốn cái thì chạy:

    node scripts/tao-khoa-ky.mjs --xoa

để xoá file khoá khỏi máy. Nội dung của nó đã nằm trong Secrets rồi, giữ thêm
bản trên đĩa chỉ tổ rò rỉ.

LƯU Ý: lần cài APK ĐẦU TIÊN sau khi đổi khoá vẫn phải gỡ app cũ đi — bản cũ ký
bằng khoá gỡ lỗi, không có cách nào chuyển sang khoá mới mà giữ được chữ ký.
Nên trước khi gỡ, vào Cài đặt trong app bấm "Xuất JSON" lưu lại một bản, hoặc
bật đồng bộ GitHub. Từ lần thứ hai trở đi thì cài đè bình thường, không mất gì.
`);
