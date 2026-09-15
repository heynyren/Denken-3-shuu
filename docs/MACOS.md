# Bản macOS

## Tải về

Vào tab **Actions** → **Build macOS app** → bấm **Run workflow**. Chạy xong,
file `.dmg` nằm ở mục **Releases** của repo. Hai bản, chọn đúng một bản:

| File | Dành cho |
|---|---|
| `Denken-3-shuu-<phiên bản>-arm64.dmg` | MacBook chip Apple (M1, M2, M3, M4) — **máy đời mới dùng bản này** |
| `Denken-3-shuu-<phiên bản>-x64.dmg` | MacBook chip Intel (đời 2019 trở về trước) |

Không chắc máy mình chip gì:  → **About This Mac**. Dòng *Chip* ghi
"Apple M..." là arm64; ghi "Intel Core..." là x64.

## Lần mở đầu tiên: macOS sẽ chặn

Cài xong, mở app lần đầu, macOS nhiều khả năng báo:

> **"Denken 3-shuu" is damaged and can't be opened. You should move it to the Trash.**
> (hoặc: *Apple could not verify "Denken 3-shuu" is free of malware*)

**App không hỏng.** Đây là Gatekeeper chặn mọi app tải từ Internet mà không kèm
chứng chỉ Apple Developer — thứ phải trả 99 USD/năm mới có. Câu báo "đã hỏng" là
cách diễn đạt gây hiểu nhầm của macOS cho tình huống "không xác minh được nguồn".

Cách chữa, chạy **một lần duy nhất** trong Terminal sau khi đã kéo app vào
thư mục Applications:

```bash
xattr -dr com.apple.quarantine "/Applications/Denken 3-shuu.app"
```

Lệnh này gỡ nhãn "tải từ Internet" mà macOS đính vào file. Từ đó mở app bình
thường, không phải làm lại, kể cả khi cập nhật bản mới (lặp lại lệnh nếu có).

Cách khác, không cần Terminal: chuột phải vào app → **Open** → trong hộp thoại
bấm **Open** lần nữa. Cách này ăn thua trên một số bản macOS, nhưng từ macOS 15
(Sequoia) trở đi Apple đã siết lại nên thường phải vào
**System Settings → Privacy & Security**, kéo xuống cuối, bấm **Open Anyway**.

## Dữ liệu học nằm ở đâu

```
~/Library/Application Support/Denken 3-shuu/
    data.json          sổ ôn thi
    backups/           bản sao lưu hằng ngày, giữ 30 bản
    attachments/       ảnh và PDF đính kèm ghi chú
    sync-config.json   cấu hình đồng bộ (có token — đừng gửi cho ai)
```

Thư mục `Library` bị ẩn trong Finder. Mở bằng **Go → Go to Folder** (⇧⌘G) rồi
dán đường dẫn trên, hoặc bấm nút **Mở thư mục dữ liệu** trong màn Cài đặt của app.

Gỡ app **không** xoá thư mục này — tiến độ học sống sót qua mọi lần cài lại.

## Đồng bộ với máy Windows và điện thoại

Giống hệt hai bản kia: **Cài đặt → Đồng bộ tự động qua GitHub**, dùng chung một
repo riêng tư và token. Xem `docs/DONG-BO-GITHUB.md`.

Gộp dữ liệu là gộp ba chiều theo `sync-base.json`, nên mở app trên MacBook mới
rồi đồng bộ sẽ **kéo về** toàn bộ tiến độ đang có, chứ không ghi đè sổ trắng lên
những gì bạn đã học trên máy Windows.

## Tự đóng gói trên máy Mac

```bash
npm ci
npm run pack:mac      # ra release/*.dmg
```

Cần Node 22. Không cần chứng chỉ Apple — `identity: null` trong
`electron-builder.yml` đã tắt phần ký chính danh.
