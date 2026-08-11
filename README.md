# 電験三種 — Sổ ôn thi

App máy tính (Windows) để ôn thi 電験三種, dựng từ file Excel "Bài tập điện hạng 3 — Tổng hợp".

Danh mục **1608 bài** trên denken-ou.com, chia bốn môn:

| Môn | Số bài | Chủ đề |
|---|---:|---:|
| 理論 Lý thuyết | 437 | 10 |
| 電力 Điện lực | 412 | 11 |
| 機械 Máy điện | 432 | 14 |
| 法規 Pháp quy | 327 | 11 |

## Có gì

- **Hôm nay** — vòng tròn KPI ngày, chuỗi ngày liên tiếp 🔥, đếm ngược tới ngày thi, tiến độ bốn môn, biểu đồ 12 tuần, lịch ôn 14 ngày tới, lịch nhiệt 17 tuần, 15 huy hiệu.
- **Ôn tập** — ba hàng đợi: đến hạn hôm nay / đang làm sai / chưa làm. Lọc theo môn, chủ đề và độ khó ★1–5. Chấm đúng/sai bằng phím `1`/`2`.
- **Đồng hồ làm bài** — bấm `Space` là mở bài trên denken-ou.com và bắt đầu đếm ngược: A問題 5 phút, B問題 10 phút. Hết giờ thì chuông reo tới khi bạn tắt.
- **Danh sách bài** — cả 1608 bài, lọc theo môn / chủ đề / trạng thái / độ khó, tìm trong tên bài lẫn trong ghi chú.
- **Ghi chú** — mỗi bài nhiều ghi chú, mỗi ghi chú đính kèm được ảnh/PDF/Word. Ảnh hiện ngay trong app; chụp màn hình rồi `Ctrl+V` thẳng vào ô ghi chú.
- **Link tham khảo** — mỗi bài nhiều link, mỗi link có nút mở ngay bên cạnh.
- **Thi thử** — làm nguyên một kỳ thi thật, 24 kỳ từ H18 tới R07下. Bấm giờ 90 phút (理論/電力/機械) và 65 phút (法規), 理論/機械 chỉ được chọn một trong 問17 hoặc 問18. Chấm điểm thang 100, mốc đạt 60, kèm bảng đối chiếu từng câu.
- **Huy hiệu** — giữ kín tới khi bạn chạm mốc, lúc đó mới nhảy lên chúc mừng.
- Xuất ra Excel, JSON, hoặc gói `.zip` đầy đủ bất cứ lúc nào.

## Cập nhật app không mất dữ liệu

Đây là điều được thiết kế trước tiên, và đã được kiểm chứng bằng thực nghiệm.

Chương trình và dữ liệu nằm ở **hai thư mục tách biệt**:

```
%LOCALAPPDATA%\Programs\denken-3-shuu\     ← chương trình (installer ghi đè chỗ này)
%APPDATA%\Denken 3-shuu\data.json          ← dữ liệu của bạn (không ai đụng tới)
```

Bốn lớp bảo vệ:

1. **Đường dẫn tất định** — tên thư mục dữ liệu khoá cứng trong code (`electron/main.ts`), không lấy theo `productName`, nên đổi cấu hình đóng gói cũng không làm lạc đường dẫn.
2. **Ghi nguyên tử** — ghi ra file tạm, `fsync`, rồi mới đổi tên đè lên. Mất điện giữa chừng không để lại file hỏng.
3. **Sao lưu hằng ngày** — mỗi ngày mở app giữ một bản trong `backups/`, mặc định giữ 30 bản.
4. **Tự cứu hộ** — `data.json` hỏng thì tự lấy bản sao lưu mới nhất còn đọc được, file hỏng cất sang `corrupt/` để soi lại.

Trình gỡ cài đặt cũng **không** xoá thư mục dữ liệu (`deleteAppDataOnUninstall: false`).

### Còn khi ổ cứng hỏng?

Bốn lớp trên nằm cùng một ổ đĩa, nên chúng vô dụng khi ổ cứng hỏng, mất máy, hay
dính mã độc tống tiền. Vì thế trong **Cài đặt → Sao lưu ra ngoài máy tính** có hai
thứ nữa:

- **Nhân bản tự động** sang một thư mục bạn chọn — thường là thư mục Google Drive
  hoặc OneDrive trên máy. Sau mỗi lần ghi, app chép thêm một bản sang đó, kể cả file
  đính kèm. Không cần tài khoản hay khoá API, chỉ là ghi file.
- **Xuất toàn bộ (.zip)** gồm cả `data.json` lẫn ảnh đính kèm. Khác với file JSON —
  JSON chỉ có phần mô tả file, khôi phục từ JSON là mất ảnh.

Chi tiết và thiết kế đồng bộ với app Android sau này:
[docs/SAO-LUU-VA-DONG-BO.md](docs/SAO-LUU-VA-DONG-BO.md).

## Ranh giới code / dữ liệu

Đây là nguyên tắc chia xuyên suốt cả dự án:

| | Nằm ở đâu | Cập nhật app |
|---|---|---|
| Link bài tập, tên bài, chủ đề, độ khó ★ | `src/data/catalog.json` — **đi kèm code** | được cập nhật theo |
| Ghi chú, link tham khảo, trạng thái, lịch ôn, KPI | `%APPDATA%\Denken 3-shuu\data.json` — **dữ liệu** | không đụng tới |

Hai bên nối nhau bằng `id` sinh từ link denken-ou.com, nên thêm bài mới vào danh mục cũng không làm lệch tiến độ cũ.

> `src/data/seed.json` trong repo cố ý để **trống**: ghi chú và link tham khảo là dữ liệu cá nhân, không nên nằm trong repo công khai. Nạp dữ liệu của bạn bằng nút **Nhập từ file Excel** trong Cài đặt.

## Cài đặt và cập nhật

Chạy thẳng file `Denken-3-shuu-Setup-*.exe`. **Không cần gỡ bản cũ trước** —
trình cài đặt tự gỡ bản cũ rồi cài bản mới. Chỉ cần đóng app nếu đang mở.

Kể cả khi bạn tự gỡ rồi cài lại, dữ liệu vẫn còn nguyên: trình gỡ cài đặt được
cấu hình `deleteAppDataOnUninstall: false` nên không đụng tới thư mục
`%APPDATA%\Denken 3-shuu`.

Windows có thể cảnh báo SmartScreen vì file chưa mua chứng chỉ ký số —
bấm **More info → Run anyway**.

## Tải về

Vào tab [Actions](../../actions) → chọn lần chạy mới nhất → tải `Denken-3-shuu-Setup`.
Hoặc đẩy một tag `v*` để CI tạo bản phát hành:

```bash
git tag v1.0.0 && git push origin v1.0.0
```

## Chạy từ mã nguồn

```bash
npm install
npm run dev          # chế độ phát triển, nạp lại nóng
npm run build        # kiểm tra kiểu + build cả hai phần
npm run pack:win     # đóng gói .exe (phải chạy trên Windows)
```

Muốn nhúng sẵn dữ liệu của mình vào bản cài đặt (chỉ nên làm với repo riêng tư):

```bash
cp "file Excel cua ban.xlsx" scripts/source.xlsx
npm run convert      # sinh catalog.json + seed.json
npm run pack:win
```

## Bảng đáp án cho thi thử

Chức năng thi thử cần biết đáp án đúng của từng câu. Đáp án là dữ liệu chung cho
mọi người dùng nên nằm ở `src/data/answers.json`, đi kèm code.

Câu nào chưa có đáp án thì bài thi vẫn cho làm và vẫn bấm giờ, chỉ là không chấm
câu đó; điểm được quy về thang 100 trên phần chấm được, **không** coi câu thiếu
đáp án là sai.

**A問題 một ý, B問題 hai ý.** Đề thật hỏi (a) và (b) riêng, mỗi ý một đáp án và
chấm điểm riêng — đúng một ý vẫn được nửa số điểm của câu đó. Vì vậy đáp án của
mỗi câu là một mảng 1 hoặc 2 phần tử:

```jsonc
"riron:rironr3-1":  [4],      // A問題 — một đáp án
"riron:rironr3-15": [3, 5]    // B問題 — ý (a) là 3, ý (b) là 5
```

Trong file CSV, cột `so_y` cho biết câu đó cần mấy đáp án:

| so_y | điền gì |
|---|---|
| `1` | chỉ `dap_an_1` |
| `2` | cả `dap_an_1` (ý a) và `dap_an_2` (ý b) |

Chấp nhận `3`, `(3)` hoặc `③`.

```bash
python3 scripts/bao-cao-thieu.py            # còn thiếu gì, kỳ nào (đếm theo ý)
python3 scripts/bao-cao-thieu.py --chi-tiet # liệt kê từng câu kèm link
python3 scripts/bao-cao-thieu.py --csv      # xuất CSV để điền
python3 scripts/build-answers.py scripts/con-thieu.csv   # nạp vào answers.json
```

Cũng có thể thêm hai cột "Đáp án (a)" và "Đáp án (b)" vào file Excel rồi chạy
`python3 scripts/build-answers.py scripts/source.xlsx`.

## Chu kỳ ôn tập

Giữ đúng chu kỳ trong file Excel gốc. Làm đúng thì lên một cấp, làm sai thì về cấp 1:

| Cấp | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Ôn lại sau | 1 ngày | 3 ngày | 7 ngày | 14 ngày | 30 ngày | 90 ngày |

## Cấu trúc mã nguồn

```
electron/          tiến trình chính — giữ file, gác cổng IPC
  main.ts          cửa sổ, các kênh IPC, chặn điều hướng
  store.ts         đọc/ghi nguyên tử, sao lưu, cứu hộ, di trú schema
  attachments.ts   file đính kèm, chặn đường dẫn vượt thư mục
  mirror.ts        nhân bản ra thư mục đám mây, xuất .zip
  import-xlsx.ts   nhập tiến độ từ Excel
  export-xlsx.ts   xuất ra Excel giống bố cục gốc
  preload.ts       cầu nối duy nhất sang giao diện
src/
  lib/             kiểu dữ liệu, chu kỳ ôn, thống kê, huy hiệu
  state/           tầng trạng thái, tự lưu sau 600ms
  views/           5 màn hình
  data/catalog.json  danh mục 1608 bài
scripts/
  convert-excel.py Excel → catalog.json + seed.json
  build-answers.py CSV/Excel → answers.json (đáp án thi thử)
  bao-cao-thieu.py báo cáo câu thiếu và đáp án thiếu
docs/
  SAO-LUU-VA-DONG-BO.md  phương án sao lưu và đồng bộ Android
```

## Giấy phép

MIT
