# Sao lưu khi máy hỏng, và đồng bộ với app Android

Tài liệu này trả lời hai câu hỏi:

1. Máy tính hỏng thì lấy lại dữ liệu học tập bằng cách nào?
2. Dựng máy chủ bằng Google Apps Script để sau này đồng bộ với app Android thì làm thế nào, và có nên không?

---

## 1. Cái gì cần bảo vệ

Toàn bộ dữ liệu nằm ở `%APPDATA%\Denken 3-shuu\`:

```
data.json          tiến độ, ghi chú, link tham khảo, KPI, huy hiệu
attachments/       ảnh, PDF, Word đính kèm ghi chú
backups/           bản chụp hằng ngày, giữ 30 bản
```

Kích thước đo trên dữ liệu thật:

| | Hiện tại | Ước lượng sau 1–2 năm dùng |
|---|---:|---:|
| `data.json` | **312 KB** | ~2.5 MB |
| `attachments/` | 0 | vài trăm MB nếu chụp màn hình nhiều |

`data.json` nhỏ và nén rất tốt. **Ảnh đính kèm mới là phần nặng** — đây là chi tiết quyết định toàn bộ thiết kế bên dưới: hai phần này phải đi hai đường khác nhau.

## 2. Rủi ro thật

Cơ chế sao lưu hiện có (30 bản trong `backups/`) chống được: xoá nhầm, ghi hỏng, thao tác sai. Nhưng **nó nằm cùng ổ đĩa với bản gốc**, nên vô dụng trước đúng ba tình huống bạn hỏi:

| Rủi ro | `backups/` cứu được? |
|---|---|
| Xoá nhầm, ghi hỏng, sửa sai | ✅ có |
| **Ổ cứng hỏng** | ❌ mất cả gốc lẫn bản sao |
| **Mất máy, cháy, trộm** | ❌ |
| **Mã độc tống tiền** | ❌ mã hoá luôn cả thư mục sao lưu |

Kết luận: bản sao phải nằm **ngoài máy tính**. Đây là điều kiện bắt buộc, mọi phương án dưới đây đều xoay quanh nó.

## 3. Ba tầng sao lưu

### Tầng 1 — Bản chụp hằng ngày trên máy ✅ đã có

Chống thao tác sai. Không chống hỏng ổ cứng.

### Tầng 2 — Nhân bản sang thư mục đám mây ⭐ nên làm trước

Cách rẻ và chắc nhất: sau mỗi lần ghi, app chép thêm một bản vào thư mục do bạn chọn — ví dụ `G:\My Drive\Denken` hoặc thư mục OneDrive. Ứng dụng Google Drive / OneDrive trên máy tự đẩy lên mây.

**Vì sao chọn cách này:**

- Không cần tài khoản, khoá API, hay máy chủ nào.
- Không phụ thuộc dịch vụ nào của bên thứ ba trong code — chỉ là ghi file.
- Ảnh đính kèm cũng được nhân bản, không cần cơ chế riêng.
- Máy hỏng → cài Windows mới → cài app → chép thư mục về là xong.
- Tự chạy, không dựa vào việc bạn nhớ bấm nút.

**Đánh đổi:** cần cài sẵn ứng dụng đồng bộ đám mây; và nếu hai máy cùng ghi vào một thư mục Drive thì Drive sẽ tạo bản "conflicted copy" chứ không tự gộp. Với một người dùng, một máy thì không thành vấn đề.

### Tầng 3 — Xuất file nén thủ công

Nút "Xuất toàn bộ (.zip)" gói cả `data.json` lẫn `attachments/`. Dùng khi muốn cất một bản mốc trước lúc làm gì đó mạo hiểm, hoặc chuyển sang máy khác.

Khác với "Xuất bản sao lưu (JSON)" hiện có — file JSON **không chứa ảnh đính kèm**, chỉ chứa phần mô tả. Khôi phục từ JSON sẽ mất ảnh.

---

## 4. Đồng bộ với app Android qua Google Apps Script

### 4.1 Chọn chỗ chứa

| Cách chứa | Giới hạn | Kết luận |
|---|---|---|
| Properties Service | **500 KB/thuộc tính** | ❌ không đủ — `data.json` đã 312 KB và sẽ tăng |
| Google Sheets | 10 triệu ô, nhưng đọc/ghi chậm và phải bẻ JSON thành hàng cột | ⚠️ chỉ hợp nếu muốn tự xem bằng mắt |
| **File JSON trên Google Drive** | 15 GB miễn phí | ✅ **nên dùng** |
| Ảnh đính kèm trên Drive | 15 GB chung | ✅ mỗi file một Drive file ID |

### 4.2 Kiến trúc

```
  App Windows ─┐                    ┌─ Apps Script Web App (doGet/doPost)
               ├── HTTPS + token ───┤     │
  App Android ─┘                    │     ├─ tien-do.json      (Drive)
                                    │     └─ attachments/      (thư mục Drive)
                                    └─ khoá theo LockService
```

Apps Script Web App đóng vai máy chủ. Triển khai dạng "Execute as me, Anyone with the link", kèm một chuỗi bí mật trong header — vì Apps Script không cho đặt xác thực riêng cho web app công khai.

### 4.3 Gộp dữ liệu — phần quan trọng nhất

**Không được dùng "ghi đè cả file, ai ghi sau thắng".** Học trên điện thoại buổi sáng, mở máy tính buổi tối, máy tính đẩy lên là xoá sạch buổi sáng.

Cách đúng: **gộp theo từng bài, dựa trên dấu thời gian riêng của bài đó.**

Cần thêm một trường vào mỗi bản ghi tiến độ:

```jsonc
"riron:rironr7-2-1": {
  "status": "correct",
  "updatedAt": "2026-08-11T09:30:00Z",   // ← thêm mới
  ...
}
```

Luồng đồng bộ:

1. Máy gửi lên những bài có `updatedAt` mới hơn lần đồng bộ trước.
2. Máy chủ so từng bài: bài nào trên máy chủ cũ hơn thì ghi đè, mới hơn thì giữ.
3. Máy chủ trả về những bài đã đổi kể từ mốc máy hỏi.
4. Máy gộp vào dữ liệu của mình theo đúng luật trên.

`dailyLog` phải gộp bằng **cộng dồn theo ngày**, không phải ghi đè: làm 10 bài trên điện thoại và 20 bài trên máy tính thì hôm đó là 30 bài.

Vẫn còn một trường hợp không tự xử lý được: sửa **cùng một bài** trên hai máy khi đang ngoại tuyến. Lúc đó bên có `updatedAt` mới hơn thắng, bên kia mất. Với một người dùng thì hiếm, nhưng phải biết là nó tồn tại.

### 4.4 Ảnh đính kèm đi đường riêng

Ảnh **không đi qua Apps Script**. Lý do: mỗi lần chạy Apps Script tối đa 6 phút, và đẩy vài chục MB ảnh qua đó là cách nhanh nhất để chạm trần hạn ngạch.

Thay vào đó, ảnh được tải thẳng lên một thư mục Drive, và trong `data.json` chỉ lưu Drive file ID:

```jsonc
"attachments": [
  { "id": "att-1", "name": "so-do.png", "file": "uuid.png",
    "driveId": "1AbC…", "kind": "image", "size": 184320 }
]
```

Máy nào cần xem ảnh thì tải theo `driveId` rồi cất vào `attachments/` của máy đó. Ảnh chỉ tải một lần, sau đó nằm sẵn trên máy.

### 4.5 Hạn ngạch phải tôn trọng

| Giới hạn Apps Script | Cách xoay xở |
|---|---|
| 6 phút mỗi lần chạy | Gửi theo lô, mỗi lô vài trăm bài |
| 20.000 lần gọi URL Fetch/ngày | Đồng bộ theo nhịp (mở app, đóng app, mỗi 15 phút) — không phải mỗi lần gõ phím |
| Ghi Drive đồng thời | Dùng `LockService` để hai máy không ghi đè nhau giữa chừng |
| 50 MB mỗi phản hồi | `data.json` 2,5 MB — thoải mái |

### 4.6 Rủi ro cần nói thẳng

- **Xác thực yếu.** "Anyone with the link" + chuỗi bí mật nghĩa là ai có URL và chuỗi đó thì đọc ghi được toàn bộ. Chuỗi bí mật không được nằm trong repo công khai. Nếu lộ, phải triển khai lại web app để đổi URL.
- **Phụ thuộc Google.** Apps Script có thể đổi hạn ngạch hoặc chính sách. Chính vì thế tầng 2 (nhân bản thư mục) vẫn phải giữ — nó không phụ thuộc gì cả.
- **Không tức thời.** Đây là đồng bộ theo nhịp, không phải thời gian thực. Học xong trên điện thoại thì máy tính phải đồng bộ mới thấy.
- **Apps Script không phải máy chủ thật.** Đúng cho một người dùng. Nếu sau này chia sẻ app cho nhiều người học, hạn ngạch sẽ vỡ và phải chuyển sang máy chủ thật.

---

## 5. Đề xuất

**Làm ngay** — giải quyết trọn câu "máy tính tôi hỏng":

1. Nhân bản thư mục dữ liệu sang thư mục đám mây bạn chọn, tự động sau mỗi lần ghi.
2. Nút xuất `.zip` gồm cả ảnh đính kèm.

Hai việc này không cần tài khoản, không cần máy chủ, không phụ thuộc dịch vụ nào — và đã đủ để không bao giờ mất dữ liệu vì hỏng máy.

**Làm khi bắt tay vào app Android** — chưa cần lúc này:

3. Thêm `updatedAt` cho mỗi bản ghi tiến độ. *Việc này nên làm sớm, kể cả khi chưa đồng bộ*, vì dữ liệu ghi ra hôm nay mà thiếu dấu thời gian thì sau này không gộp được.
4. Dựng Apps Script Web App theo mục 4.
5. Đẩy ảnh lên Drive, lưu `driveId`.

**Không nên làm:** dùng Properties Service (500 KB là không đủ), hoặc gộp kiểu ghi đè cả file (mất dữ liệu khi dùng hai máy).
