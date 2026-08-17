# Vì sao APK tải từ GitHub bắt gỡ app đi cài lại

## Câu hỏi

> Ngày xưa làm trên Android Studio, gửi bản vá sang điện thoại là cập nhật đè
> luôn. Còn APK tải từ GitHub thì lần nào cũng phải gỡ app cũ đi mới cài được.
> Vì sao?

## Trả lời ngắn

**Chữ ký khác nhau.**

Android không nhận diện app bằng tên hay biểu tượng, mà bằng khoá đã ký nó.
Cài đè bản mới lên bản cũ chỉ được phép khi hai bản ký bằng **cùng một khoá**.
Khác khoá thì hệ điều hành từ chối thẳng — thường hiện "App not installed" hoặc
"Ứng dụng chưa được cài đặt" — và cách duy nhất là gỡ bản cũ đi.

- **Android Studio** ký bằng `~/.android/debug.keystore` trên máy bạn. File đó
  nằm yên một chỗ, tạo ra từ lần đầu mở Android Studio và không đổi nữa. Nên
  mọi bản build từ máy đó đều cùng chữ ký → cài đè thoải mái.

- **Máy chạy của GitHub** mỗi lần build là một máy ảo mới tinh, dựng lên rồi
  huỷ. Nó không có `debug.keystore` nào cả, nên Gradle tự sinh một cái mới.
  Khoá mới → chữ ký mới → **mỗi bản build là một chữ ký khác nhau**.

## Vì sao chuyện này nghiêm trọng hơn vẻ ngoài của nó

Gỡ app trên Android là **xoá luôn thư mục dữ liệu riêng của app**. Sổ ôn thi
của bạn (`data.json`), toàn bộ ghi chú, link tham khảo, ảnh đính kèm, cả thư
mục `backups/` — nằm hết trong đó.

Nghĩa là mỗi lần cập nhật một bản vá, bạn mất sạch tiến độ đã học. Đây là một
trong hai nguyên nhân của chuyện "app Android không lưu được dữ liệu"; nguyên
nhân còn lại nằm ở đường ghi file, đã sửa trong `src/platform/kho-android.ts`.

## Cách sửa — làm một lần, xong hẳn

Chạy trên máy bạn (cần cài Java/JDK 17 trở lên):

```bash
npm run android:khoa-ky
```

Lệnh này tạo một khoá ký cố định, hạn 100 năm, mật khẩu ngẫu nhiên, rồi in ra
bốn giá trị. Vào GitHub:

    Settings → Secrets and variables → Actions → New repository secret

tạo đúng bốn secret, tên viết y hệt:

| Tên secret | Nội dung |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | chuỗi base64 dài mà lệnh in ra |
| `ANDROID_STORE_PASSWORD` | mật khẩu lệnh sinh ra |
| `ANDROID_KEY_ALIAS` | `denken` |
| `ANDROID_KEY_PASSWORD` | cùng mật khẩu ở trên |

Xong rồi xoá file khoá khỏi máy:

```bash
npm run android:khoa-ky -- --xoa
```

Từ lần build sau, luồng `build-android.yml` tự lấy khoá từ Secrets ra ký. Mọi
APK về sau cùng một chữ ký, cập nhật đè bình thường, dữ liệu còn nguyên.

## Hai điều phải nhớ

**1. Lần chuyển đổi ĐẦU TIÊN vẫn phải gỡ app.** Bản đang cài trên máy ký bằng
khoá gỡ lỗi cũ; không có cách nào đổi chữ ký của một app đã cài. Nên **trước
khi gỡ**, cứu dữ liệu ra đã:

- Mở app → Cài đặt → **Xuất JSON**, gửi file đó vào Drive/Zalo của mình; hoặc
- Bật **đồng bộ GitHub** (xem `docs/DONG-BO-GITHUB.md`) rồi bấm đồng bộ một lần.

Cài bản mới xong thì nhập lại/đồng bộ về. Từ lần thứ hai trở đi không phải làm
gì nữa.

**2. Đừng bao giờ tạo lại khoá.** Tạo khoá mới là quay lại đúng vấn đề này —
lại phải gỡ app, lại mất dữ liệu. Script đã chặn sẵn: thấy file khoá cũ là nó
từ chối chạy. Nhưng Secrets trên GitHub thì bạn tự sửa được, nên nhớ giùm.

Khoá **không được commit vào repo**. Repo này đang để công khai; ai cầm được
khoá là ký được một app giả mạo cài đè lên app thật của bạn. `.gitignore` đã
chặn `*.keystore`, nhưng chặn được file thì không chặn được thao tác dán nhầm.
