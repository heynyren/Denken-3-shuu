# Chuẩn bị đồng bộ qua Google Drive

Tài liệu này là **việc của bạn làm ở phía Google**, làm một lần rồi thôi. Phần
code trong app sẽ nhận vào hai chuỗi Client ID ở cuối cùng.

Ước lượng: khoảng 20–30 phút, phần lớn là chờ các trang của Google tải.

---

## 0. Thứ tự làm, và vì sao theo thứ tự đó

```
1. Tạo khoá ký Android  ──► lấy vân tay SHA-1 ─┐
2. Tạo dự án Google Cloud                       │
3. Bật Google Drive API                         │
4. Khai báo màn hình đồng ý (OAuth consent)     │
5. Tạo Client ID cho máy tính                   │
6. Tạo Client ID cho Android  ◄─────────────────┘ (cần SHA-1 ở bước 1)
7. Cất khoá ký vào GitHub secrets
8. Gửi lại cho tôi hai Client ID
```

Khoá ký phải làm **trước**, vì bước 6 đòi vân tay của nó.

---

## 1. Tạo khoá ký Android — làm trước tiên

### Vì sao bắt buộc

Client OAuth Android của Google khoá theo **vân tay SHA-1 của khoá ký APK**.
APK gỡ lỗi được ký bằng khoá máy tự sinh — mỗi máy một khoá khác, và GitHub
Actions sinh khoá mới **mỗi lần chạy**. Nghĩa là nếu dùng khoá gỡ lỗi thì đăng
nhập Google sẽ hỏng ngay sau lần build kế tiếp.

Nên phải có một khoá cố định, tạo một lần và giữ mãi.

> ⚠️ **Mất khoá này là mất luôn quyền cập nhật app.** Android chỉ cho cài đè bản
> mới khi nó được ký bằng đúng khoá cũ; mất khoá thì người dùng phải gỡ app ra
> cài lại (mất sạch dữ liệu trên máy đó). Cất file `.keystore` và mật khẩu vào
> chỗ nào bạn chắc chắn không mất — trình quản lý mật khẩu, hoặc một thư mục
> Drive riêng.

### Cách tạo

Cần Java trên máy. Nếu chưa có, cài **Temurin JDK 21**
(https://adoptium.net) rồi mở PowerShell:

```powershell
keytool -genkeypair -v `
  -keystore denken.keystore `
  -alias denken `
  -keyalg RSA -keysize 2048 -validity 10000 `
  -storetype PKCS12
```

Nó sẽ hỏi mật khẩu (đặt gì cũng được, **nhớ lấy**) và vài câu về tên, tổ chức,
thành phố — điền gì cũng được, không ai kiểm tra.

### Lấy vân tay SHA-1

```powershell
keytool -list -v -keystore denken.keystore -alias denken
```

Trong đống chữ in ra, tìm dòng:

```
SHA1: A1:B2:C3:D4:E5:F6:...
```

Chép nguyên chuỗi đó (cả dấu hai chấm) — bước 6 cần.

---

## 2. Tạo dự án Google Cloud

1. Vào https://console.cloud.google.com
2. Trên thanh trên cùng, bấm chỗ chọn dự án → **New project**
3. Đặt tên gì cũng được, ví dụ `Denken 3-shuu`
4. **Create**, rồi chờ vài giây và chọn đúng dự án vừa tạo

Không cần thẻ tín dụng. Không tốn tiền — Drive API miễn phí ở mức dùng cá nhân.

---

## 3. Bật Google Drive API

1. Menu trái → **APIs & Services** → **Library**
2. Gõ tìm `Google Drive API`
3. Bấm vào kết quả → **Enable**

---

## 4. Màn hình đồng ý (OAuth consent screen)

Đây là màn hình Google hiện ra khi app xin quyền.

1. **APIs & Services** → **OAuth consent screen**
2. User type: **External** → **Create**
   (Internal chỉ dành cho tài khoản Google Workspace của tổ chức.)
3. Điền:
   - App name: `電験三種 Sổ ôn thi`
   - User support email: email của bạn
   - Developer contact: email của bạn
4. **Save and continue**
5. Màn **Scopes** → **Add or remove scopes** → tìm và tick:

   ```
   .../auth/drive.file
   ```

   Đúng scope này, không phải cái khác. Lý do ở mục 4.1 bên dưới.
6. **Save and continue**
7. Màn **Test users** → **Add users** → thêm chính email Google bạn sẽ dùng để
   đồng bộ. Thêm được tối đa 100 người.
8. **Save and continue** → **Back to dashboard**

**Để nguyên ở chế độ Testing.** Không bấm "Publish app". Ở chế độ Testing thì
chỉ những email trong danh sách test users mới đăng nhập được — đúng thứ ta cần,
và không phải qua vòng thẩm định nào của Google.

### 4.1 Vì sao chọn `drive.file` chứ không phải scope khác

| Scope | Quyền | Google xếp loại |
|---|---|---|
| `drive` | Đọc ghi **toàn bộ** Drive của bạn | Nhạy cảm — thừa quyền, đừng dùng |
| `drive.appdata` | Một thư mục ẩn riêng của app | Nhạy cảm — cần thẩm định nếu phát hành |
| **`drive.file`** | **Chỉ những file do chính app tạo ra** | **Không nhạy cảm** |

`drive.file` cho app đúng một quyền: tạo file của nó và đọc lại file đó. App
**không** nhìn thấy bất kỳ file nào khác trong Drive của bạn — kể cả khi code có
lỗi hay bị sửa đổi. Đây là ranh giới do Google giữ, không phải do code tự hứa.

Thêm một điểm lợi: file đồng bộ nằm ngay trong "My Drive" nên bạn tự mở, tự tải
về, tự chép đi nơi khác được. Với `drive.appdata` thì file bị giấu, muốn lấy ra
phải qua app.

---

## 5. Client ID cho máy tính (bản Windows)

1. **APIs & Services** → **Credentials** → **Create credentials** →
   **OAuth client ID**
2. Application type: **Desktop app**
3. Name: `Denken Windows`
4. **Create**

Google hiện ra Client ID và Client secret.

> Client secret của loại "Desktop app" **không phải bí mật thật** — Google nói rõ
> nó không thể giữ kín trong một app cài trên máy người dùng, và bảo mật dựa vào
> PKCE chứ không dựa vào chuỗi này. Dù vậy vẫn đừng đưa nó vào repo công khai:
> app sẽ nhận nó qua màn Cài đặt và cất vào **dữ liệu** (`data.json`), không phải
> vào code.

Chép lại **Client ID** (dạng `123456789-abc...apps.googleusercontent.com`).

---

## 6. Client ID cho Android

1. **Create credentials** → **OAuth client ID**
2. Application type: **Android**
3. Name: `Denken Android`
4. Package name — điền **chính xác** chuỗi này:

   ```
   com.heynyren.denken3shuu
   ```

5. SHA-1 certificate fingerprint: dán chuỗi SHA-1 lấy ở bước 1
6. **Create**

Loại Android không có client secret — đúng như vậy, không phải thiếu.

Chép lại **Client ID**.

---

## 7. Cất khoá ký vào GitHub

Để CI ký APK bằng đúng khoá đó, nếu không thì SHA-1 lại đổi và bước 6 thành vô nghĩa.

Đổi file khoá sang base64 (PowerShell):

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("denken.keystore")) | Set-Clipboard
```

Rồi vào repo trên GitHub → **Settings** → **Secrets and variables** → **Actions**
→ **New repository secret**, tạo bốn secret:

| Tên secret | Giá trị |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | chuỗi base64 vừa chép |
| `ANDROID_STORE_PASSWORD` | mật khẩu kho khoá ở bước 1 |
| `ANDROID_KEY_ALIAS` | `denken` |
| `ANDROID_KEY_PASSWORD` | mật khẩu khoá (thường trùng mật khẩu kho) |

Workflow đã chuẩn bị sẵn: có đủ bốn secret thì nó ký bằng khoá của bạn, thiếu thì
nó vẫn build bình thường bằng khoá gỡ lỗi (chỉ là không đăng nhập Google được).

> Đây là lý do nữa để **chuyển repo sang private**. Secret của GitHub thì repo
> công khai cũng không lộ, nhưng không có lý do gì để công khai cả.

---

## 8. Gửi lại cho tôi

Chỉ cần hai dòng này:

```
Client ID máy tính: ....................apps.googleusercontent.com
Client ID Android : ....................apps.googleusercontent.com
```

**Đừng gửi:** file `.keystore`, mật khẩu, hay client secret. Client ID không phải
bí mật — nó hiện ra trong mọi request và nằm được trong code. Ba thứ kia thì
không, và tôi cũng không cần chúng để viết phần đồng bộ.

---

## 9. Sau đó tôi làm gì

1. Màn **Cài đặt → Đồng bộ**: nút đăng nhập Google, hiện tài khoản đang dùng và
   thời điểm đồng bộ gần nhất.
2. Luồng OAuth: Authorization Code + PKCE, mở bằng trình duyệt hệ thống chứ không
   nhúng WebView — Google chặn đăng nhập trong WebView nhúng, và trình duyệt hệ
   thống thì dùng lại được phiên đăng nhập sẵn có.
3. Đọc/ghi một file `denken-3-shuu.json` trên Drive qua Drive REST API.
4. Nối vào `mergeData()` đã viết và đã kiểm thử (29 điểm kiểm tra) — phần khó
   nhất đã xong từ trước, còn lại chỉ là đường truyền.
5. Đồng bộ theo nhịp: lúc mở app, lúc đóng app, và một nút bấm tay. Không đồng bộ
   sau mỗi lần gõ phím.

Những gì tôi **không** kiểm chứng được ở môi trường này, bạn sẽ là người thử:
đăng nhập thật, cài APK thật, và lần đồng bộ đầu tiên giữa hai máy.
