# Đề thi PDF

Bỏ file PDF đề thi vào **thư mục này**, đặt tên theo `{môn}{mã kỳ}.pdf`:

```
de-thi/rironr8-1.pdf       理論 令和8年度上期
de-thi/denryokur8-1.pdf    電力 令和8年度上期
de-thi/kikaih22.pdf        機械 平成22年度
de-thi/houkir4-2.pdf       法規 令和4年度下期
```

Mã kỳ chính là đoạn nằm trong link denken-ou: `rironr8-1-13` → mã kỳ là `r8-1`.

Xem đủ bộ 100 tên hợp lệ, kèm dấu bên nào đã có:

```bash
node scripts/nap-de-thi.mjs --ten
```

Nạp vào app (chạy tự động trong `npm run build`):

```bash
node scripts/nap-de-thi.mjs
```

Tên nào không ứng với một cặp (kỳ thi, môn) có thật thì **không được nạp** và
script báo ra — đặt sai tên mà cứ nạp thì app tưởng kỳ đó có đề, bấm vào ra file
của kỳ khác, là kiểu sai khó thấy nhất khi đang thi.

## Kỳ nào có đề thì không còn link denken-ou

Trong phòng thi, môn nào có đề PDF thì hiện nút **Mở đề PDF** và **ẩn hết** nút
`↗` sang denken-ou. Môn nào chưa có đề thì giữ nguyên link như trước.

Lý do ẩn: trang denken-ou có sẵn cả lời giải, mở ra giữa lúc đang thi là tự phá
buổi thi của mình. Có đề gốc thì nên mở đề, không mở trang giải.

## Chỗ chứa, và thứ tự ưu tiên

| Chỗ | Ai bỏ vào | Bị ghi đè khi cập nhật app |
|---|---|---|
| Trong bản build (`de-thi/` → `public/de-thi/`) | đi theo app | có |
| `<thư mục dữ liệu>/de-thi/` | người dùng tự bỏ | không |

Trùng tên thì lấy bản của người dùng — bỏ tay vào là có ý thay.

Trên máy tính, thư mục dữ liệu mở được bằng **Cài đặt → Mở thư mục dữ liệu**.
Trên Android thư mục đó là của riêng app, không vào được bằng trình quản lý
file, nên đề cho điện thoại phải đi theo bản build.

## Lưu ý về dung lượng

Đề đi theo bản build thì **bản cài và APK nặng thêm đúng bằng tổng dung lượng
đề**. Đủ 100 đề có thể là 100–200 MB, tức APK phình từ 6 MB lên hơn 100 MB, và
mỗi lần build lại tải lên chừng đó. Nên cân nhắc chỉ đóng gói vài kỳ gần nhất,
còn các kỳ cũ thì để người dùng tự bỏ vào thư mục dữ liệu trên máy tính.
