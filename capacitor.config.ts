import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Cấu hình bản Android.
 *
 * `webDir` trỏ vào đúng thư mục mà Vite build ra cho bản Windows — hai bên dùng
 * chung một bản build giao diện, nên không có đường nào để tính năng lệch nhau.
 */
const config: CapacitorConfig = {
  appId: "com.heynyren.denken3shuu",
  appName: "電験三種 Sổ ôn thi",
  webDir: "dist/renderer",
  android: {
    // Giao diện đã là dark mode sẵn; để nền tối ngay từ lúc khởi động cho khỏi
    // loé trắng một nhịp.
    backgroundColor: "#18191a",
  },
  server: {
    androidScheme: "https",
  },
};

export default config;
