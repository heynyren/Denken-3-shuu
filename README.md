# 電験三種 — Sổ ôn thi

App máy tính (Windows) để ôn thi 電験三種, dựng từ file Excel "Bài tập điện hạng 3 — Tổng hợp".

Danh mục **1609 bài** trên denken-ou.com, chia bốn môn:

| Môn | Số bài | Chủ đề |
|---|---:|---:|
| 理論 Lý thuyết | 437 | 10 |
| 電力 Điện lực | 413 | 12 |
| 機械 Máy điện | 432 | 14 |
| 法規 Pháp quy | 327 | 11 |

## Có gì

- **Hôm nay** — vòng tròn KPI ngày, chuỗi ngày liên tiếp 🔥, đếm ngược tới ngày thi, tiến độ bốn môn, biểu đồ 12 tuần, lịch ôn 14 ngày tới, lịch nhiệt 17 tuần, 15 huy hiệu.
- **Ôn tập** — ba hàng đợi: đến hạn hôm nay / đang làm sai / chưa làm. Lọc theo môn, chủ đề và độ khó ★1–5. Chấm đúng/sai bằng phím `1`/`2`. **Chấm xong app không tự nhảy bài** — bạn ở lại ghi chú bao lâu tuỳ ý, chuyển bài bằng `←` `→`, quay lại bài cũ lúc nào cũng được, bấm nhầm thì chấm lại ngay tại chỗ.
- **Đồng hồ làm bài** — bấm `Space` là mở bài trên denken-ou.com và bắt đầu đếm ngược: A問題 5 phút, B問題 10 phút. Hết giờ thì chuông reo tới khi bạn tắt, kèm rung và **một lời nhắc của hệ điều hành** — nên rời khỏi app sang trình duyệt đọc đề hay tắt màn hình cũng vẫn biết là hết giờ.
- **Danh sách bài** — cả 1609 bài, lọc theo môn / chủ đề / trạng thái / độ khó. **Tìm được bằng cả tiếng Nhật lẫn tiếng Việt**, có dấu hay không đều được: gõ `tụ điện`, `tu dien` hay `コンデンサ` đều ra cùng một chỗ.
- **Đã làm gần đây** — ba ngày gần nhất, xem lại câu nào bấm đúng câu nào bấm sai. Bài sai xếp lên trước; bấm vào là mở luôn cả chủ đề đó ở chế độ Ôn tập.
- **Ghi chú** — mỗi bài nhiều ghi chú, mỗi ghi chú đính kèm được ảnh/PDF/Word. Ảnh hiện ngay trong app; chụp màn hình rồi `Ctrl+V` thẳng vào ô ghi chú.
- **Link tham khảo** — mỗi bài nhiều link, mỗi link có nút mở ngay bên cạnh.
- **Thi thử** — làm nguyên một kỳ thi thật, 24 kỳ từ H18 tới R07下. Chọn nhiều môn thì thi **lần lượt**: mỗi môn một đồng hồ riêng — 90 phút (理論/電力/機械), 65 phút (法規) — nộp xong môn này mới mở môn kia, thời gian **không cộng dồn**. 理論/機械 chỉ được chọn một trong 問17 hoặc 問18. Chấm điểm thang 100, mốc đạt 60, kèm **bảng phân tích**: đúng bao nhiêu phần trăm ở từng chủ đề ra trong đề đó, rồi tới từng câu — bạn chọn gì, đáp án đúng là gì. Mở lại lượt thi cũ trong lịch sử vẫn xem được đúng bảng đó.
- **Đang yếu ở đâu** — ngay trang Hôm nay: top 5 chủ đề có tỉ lệ sai cao nhất của mỗi môn, tính gộp cả lượt ôn tập hằng ngày lẫn từng ý trong đề thi thử. Bấm một chủ đề là mở màn Ôn tập với **toàn bộ** bài của chủ đề đó, bài đang sai và chưa làm xếp lên trước.
- **Tiếng Việt** — chế độ Ôn tập hiện **bản dịch tên bài của chính bạn** — bản dịch viết sẵn trong file Excel gốc, 1608/1609 bài — ngay dưới tên bài tiếng Nhật; bài chưa dịch thì lùi về tên chủ đề. Ô tìm kiếm lục cả bản dịch này, nên gõ nguyên cụm như `suy ra lượng điện tích` cũng ra bài. Màn Thi thử cố ý **không** có: thi thì nên quen với chữ Nhật như đề thật.
- **Đồng bộ tự động máy tính ↔ điện thoại** — qua một repo riêng tư của bạn trên GitHub. Tự chạy lúc mở app, lúc quay lại app và mỗi 5 phút. **Gộp chứ không ghi đè**: mỗi bài lấy bản sửa sau cùng, số bài ôn từng ngày cộng phần mới của cả hai bên, huy hiệu và lượt thi gộp lại hết. Hai máy ghi cùng lúc thì bên sau đọc lại rồi gộp lại, không bên nào mất.
- **Huy hiệu** — giữ kín tới khi bạn chạm mốc, lúc đó mới nhảy lên chúc mừng.
- Xuất ra Excel, JSON, hoặc gói `.zip` đầy đủ bất cứ lúc nào.

## Giao diện

Tối kiểu macOS, dựng theo bản mô tả Raycast trong repo
[design-ai](https://github.com/heynyren/design-ai) — nền đen nhiều tầng, viền
nửa pixel, chữ font hệ thống, và **đúng một màu nhấn** dùng rất dè cho thứ đang
được chọn.

| Thứ | Dùng gì |
|---|---|
| Lớp tiện ích CSS | Tailwind v4 |
| Thành phần giao diện | Viết theo lối shadcn/ui — code nằm trong `src/components/ui/`, không phải thư viện cài vào |
| Icon | [Lucide](https://lucide.dev) |

**Không dùng Material UI**: Material là ngôn ngữ thiết kế của Google — nút nổi
khối, gợn sóng khi bấm, nhãn trôi trong ô nhập. Nó đá nhau với cái macOS ở trên,
mà nhét hai hệ thiết kế vào một app thì chẳng bên nào thắng.

**Không còn emoji trong giao diện.** Emoji do phông chữ của máy vẽ chứ không
phải app vẽ, nên mỗi hệ điều hành ra một kiểu, không chỉnh được nét lẫn màu, và
cạnh chữ tiếng Việt có dấu thì lệch chân. Toàn bộ đã thay bằng SVG của Lucide.

Hai chỗ dễ vỡ, và cách xử:

- **Không nạp `preflight` của Tailwind.** Nó là bộ đặt lại toàn cục xoá sạch
  style mặc định của mọi thẻ; nạp vào là vỡ cả năm màn. Chỉ nạp `theme` +
  `utilities`, xếp vào tầng riêng — `styles.css` để ngoài tầng nên luôn thắng
  khi trùng tên lớp. Xem `src/design/theme.css`.
- **`npm run soat:lop`** quét các lớp dùng ở màn mới, đối chiếu với lớp định
  nghĩa trần trong `styles.css`, báo cái nào sẽ bị chặn **im lặng**. Đã nối vào
  `npm run build`.

Kiểm thử bám vào `data-testid`, không bám tên lớp CSS — đổi giao diện thì kiểm
thử không vỡ oan.

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

## Bản Android

Cùng một kho mã, cùng một giao diện. `src/lib/` (chu kỳ ôn, thống kê, engine thi
thử, huy hiệu) không dính một dòng nào của Electron hay Capacitor — toàn bộ ràng
buộc với nền tảng gói trong **một interface 20 method** ở `src/platform/`:

```
src/platform/types.ts    interface Platform + bảng "nền tảng này làm được gì"
src/platform/desktop.ts  Windows — chuyển tiếp sang window.denken của Electron
src/platform/android.ts  Android — Capacitor Filesystem, Browser, Share, LocalNotifications
src/platform/index.ts    chọn nền tảng lúc chạy
```

Bố cục tự đổi theo bề ngang màn hình: dưới 860px thì **thanh bên đổi vai thành
thanh tab dưới đáy** — đúng chỗ ngón cái với tới — và những thứ không phải tab
(tiến độ bốn môn, tổng tiến độ) bị ẩn vì đã có sẵn ở trang Hôm nay. Mọi mục tiêu
chạm tối thiểu 44px, lưới nhiều cột gộp về một cột, có chừa chỗ cho thanh điều
hướng của hệ điều hành.

Giao diện đọc `platform.can.*` để **ẩn hẳn** nút nền tảng không làm được, thay vì
cho bấm rồi báo lỗi. Bản Android hiện chưa có: nhập/xuất Excel, gói `.zip`, nhân
bản thư mục, mở thư mục dữ liệu — nhập trên máy tính rồi đồng bộ sang là đủ.

**Chuông báo hết giờ** phải làm hai lớp mới kêu được trên điện thoại. WebView
chặn phát tiếng nếu `AudioContext` sinh ra lúc chưa có thao tác nào của người
dùng, nên app mở khoá tiếng ngay lần chạm đầu tiên (`primeAudio()` ở
`src/main.tsx`) thay vì đợi tới lúc chuông reo. Và vì đúng quy trình làm bài là
bấm mở đề rồi rời khỏi app sang trình duyệt — lúc đó Android hãm hết
`setInterval` — nên mỗi lần chạy đồng hồ, app hẹn thêm **một lời nhắc ở tầng hệ
điều hành** nổ đúng giờ kể cả khi màn hình đã tắt.

Ba lớp bảo vệ dữ liệu giữ nguyên trên Android: ghi nguyên tử (`.tmp` rồi đổi
tên), sao lưu hằng ngày 30 bản, tự cứu hộ từ bản sao lưu khi `data.json` hỏng.
Chặn đường dẫn vượt thư mục cho file đính kèm cũng giữ nguyên, và có kiểm thử.

**Icon và ảnh khởi động** sinh từ đúng file `src/assets/mark.svg` mà bản Windows
dùng, nên hai bên không bao giờ lệch nhau:

```bash
python3 scripts/tao-icon-android.py   # 26 file icon + ảnh khởi động, 16 thư mục
```

Icon Android 8 trở lên gồm hai lớp chồng nhau, mỗi lớp 108dp, rồi hệ điều hành
tự cắt theo hình của hãng máy — tròn, vuông bo, giọt nước. Chỉ **72dp ở giữa**
là chắc chắn nhìn thấy, nên nhân vật được thu vào vùng đó, riêng vạt áo cố ý kéo
dài quá đáy để cắt kiểu gì cũng không hở một khoảng trống dưới chân.

```bash
npm run android:sync    # build giao diện rồi chép sang dự án Android
npm run android:apk     # đóng gói APK (máy phải có Android SDK)
```

Máy phát triển không cài được Android SDK thì cứ đẩy lên GitHub — workflow
`build-android.yml` đóng gói APK trên runner của GitHub, y như cách bản Windows
được đóng gói trên máy Windows. Tải APK ở tab Actions, hoặc đẩy tag `v*` để APK
được đính kèm vào bản phát hành cạnh file `.exe`.

> APK ký bằng khoá gỡ lỗi thì Android vẫn cài được, nhưng **đăng nhập Google sẽ
> hỏng**: client OAuth Android khoá theo vân tay SHA-1 của khoá ký, mà khoá gỡ
> lỗi thì CI sinh mới mỗi lần chạy. Cách tạo khoá cố định và cất vào secrets:
> [docs/DONG-BO-GOOGLE-DRIVE.md](docs/DONG-BO-GOOGLE-DRIVE.md).

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

**Đã đủ cả 24 kỳ — 1920/1920 ý**, không câu nào thiếu đáp án. Phần lớn lấy từ
bảng đáp án chính thức (PDF) của 一般財団法人 電気技術者試験センター (H21 →
R07下); riêng H18, H19, H20 do người dùng tra tay và nạp qua CSV.

Nạp thêm tờ đáp án PDF mới (kỳ thi sau này) bằng:

```bash
python3 scripts/dap-an-pdf.py --thu duong/dan/*.pdf   # xem trước, chưa ghi
python3 scripts/dap-an-pdf.py duong/dan/*.pdf         # nạp vào answers.json
```

Script đọc theo **toạ độ** chứ không theo thứ tự chữ trong file, vì bốn môn xếp
cạnh nhau nên đọc xuôi là ghép nhầm đáp án môn này sang môn kia. Nó chịu được cả
hai bố cục (bố cục cũ, và bố cục từ 令和7年度 có thêm cột 配点), và tự kiểm tra
hình dạng tờ đáp án — đọc ra thiếu câu, thừa câu hay sai số ý thì dừng lại chứ
không ghi bừa vào bảng đáp án.

Câu nào chưa có đáp án thì bài thi vẫn cho làm và vẫn bấm giờ, chỉ là không chấm
câu đó; điểm được quy về thang 100 trên phần chấm được, **không** coi câu thiếu
đáp án là sai.

> **機械 問8 của H26** bị hội đồng đánh dấu ※ — đề có sai sót nên *mọi* đáp án
> đều được tính đúng. Trong app câu này đang để đáp án `5` (đáp án đúng theo lời
> giải), nên thi thử chọn khác 5 sẽ bị tính sai, trong khi kỳ thi thật thì không.
> Muốn đúng y như kỳ thi thật thì xoá câu đó khỏi `answers.json`.

**A問題 một ý, B問題 hai ý.** Đề thật hỏi (a) và (b) riêng, mỗi ý một đáp án và
chấm điểm riêng — đúng một ý vẫn được nửa số điểm của câu đó. Vì vậy đáp án của
mỗi câu là một mảng 1 hoặc 2 phần tử:

```jsonc
"riron:rironr3-1":  [4],      // A問題 — một đáp án
"riron:rironr3-15": [3, 5]    // B問題 — ý (a) là 3, ý (b) là 5
```

Muốn nhập tay thì vẫn dùng được đường CSV/Excel cũ. Cột `so_y` cho biết câu đó
cần mấy đáp án: `1` chỉ điền `dap_an_1`, `2` điền cả `dap_an_1` (ý a) và
`dap_an_2` (ý b). Chấp nhận `3`, `(3)` hoặc `③`.

```bash
python3 scripts/bao-cao-thieu.py            # còn thiếu gì, kỳ nào (đếm theo ý)
python3 scripts/bao-cao-thieu.py --chi-tiet # liệt kê từng câu kèm link
python3 scripts/bao-cao-thieu.py --csv      # xuất CSV để điền
python3 scripts/nap-con-thieu.py scripts/con-thieu.csv   # nạp CSV đã điền
```

## Vá danh mục khi thiếu link

Link denken-ou.com có cấu trúc chặt — `{môn}{kỳ}-{số câu}`, ví dụ
`denryokur4-2-9` = 電力 令和4年度下期 問9 — nên suy được cả hai chiều. Nhờ đó
`scripts/sua-danh-muc.py` tự vá được ba loại hỏng của danh mục:

| Hỏng gì | Vá thế nào |
|---|---|
| Tiêu đề trong Excel bị cụt nên mất kỳ thi / số câu, bài rơi khỏi mọi đề thi | Đọc ngược kỳ thi và số câu từ link |
| Một khối bị lệch một ô ở cột link nên vài bài mang link của bài khác | Dựng lại link từ kỳ thi và số câu |
| Thiếu hẳn bài | Thêm dòng mới, link suy từ cấu trúc |

Nó **không bao giờ đổi `id`** — tiến độ ôn tập khoá theo id, đổi id là mất lịch
sử bài đó. Sửa link thì id vẫn giữ nguyên; id chỉ là khoá, không ai đọc ngược
nội dung từ nó.

```bash
python3 scripts/sua-danh-muc.py --thu   # xem trước
python3 scripts/sua-danh-muc.py         # vá thật
```

Hiện danh mục đã **đủ cả 24 kỳ × 4 môn = 96 đề**, không đề nào thiếu câu, và
cả 96 đề đều chấm điểm được trọn vẹn.

## Bản dịch tên bài

Trong file Excel gốc, cột tiêu đề vốn đã có sẵn bản dịch tiếng Việt do người
dùng tự viết, nối sau tên tiếng Nhật bằng dấu `–` (hoặc trong ngoặc đơn ở mấy
dòng 電熱):

```
コンデンサに蓄えられる電荷を求める計算問題 – Bài tập tính toán suy ra lượng điện tích…
```

Bản chuyển Excel đầu tiên cắt nhầm đoạn đó như rác nên mất sạch. Nay
`convert-excel.py` tách đúng hai phần và ghi ra trường `nameVi`; còn với danh
mục đã vá link từ trước thì dùng script riêng để ghép lại theo link, không phải
chuyển lại từ đầu (chuyển lại sẽ mất công vá của `sua-danh-muc.py`):

```bash
python3 scripts/nap-tieng-viet.py   # Excel → nameVi cho catalog.json
```

Ghép được **1608/1609 bài**. Bài duy nhất chưa có là 電力 H22 問11 — bài do
script thêm vào lúc vá danh mục nên vốn không có trong Excel.

## Đồng bộ máy tính ↔ điện thoại

Hai đường, dùng chung một bộ luật gộp ở `src/lib/sync.ts`.

### Tự động, qua GitHub ⭐

**Cài đặt → Đồng bộ tự động qua GitHub.** Cần một repo riêng tư trống và một
token — mất chừng 3 phút, hướng dẫn từng bước ở
[docs/DONG-BO-GITHUB.md](docs/DONG-BO-GITHUB.md). Xong rồi thì không phải làm gì
nữa: app tự chạy lúc mở app, lúc quay lại app và mỗi 5 phút.

Đây là gộp **ba chiều** thật: app cất riêng bản chụp của lần đồng bộ trước
(`sync-base.json`), nên phân biệt được "bên kia vừa thêm" với "bên này vừa xoá",
và số bài ôn từng ngày cộng đúng phần mới thay vì lấy bên lớn hơn.

Hai máy ghi cùng lúc thì GitHub từ chối bên nộp mã bản cũ; app đọc lại, gộp lại,
ghi lại — tối đa ba lần. Token nằm ở `sync-config.json` cạnh `data.json`, **cố ý
không** nằm trong `data.json`, nên file bạn xuất ra hay chép sang Drive không
mang theo nó.

### Bằng tay, qua một file

**Cài đặt → Đồng bộ máy tính ↔ điện thoại**: xuất một file ở máy này, gộp vào ở
máy kia, chuyển file bằng gì cũng được. Dùng khi không muốn dính tới token, hoặc
khi máy nào đó không có mạng.

Không có bản chụp gốc để so nên số bài ôn từng ngày lấy **bên lớn hơn** thay vì
cộng — thà thiếu còn hơn thổi phồng, vì con số thổi phồng làm sai cả chuỗi ngày
liên tiếp lẫn mọi biểu đồ. Bấm nhầm hai lần liên tiếp cũng không sao, lần thứ
hai ra y nguyên.

Cả hai đường đều có kiểm thử chạy trong `npm run build` (`npm run test:sync`):
90 phép kiểm, gồm ca "đổi vai hai máy phải ra cùng một kết quả", ca máy thứ ba
ghi chen vào giữa, và ca file trên mạng hỏng thì phải dừng chứ không ghi đè.

Nút **⚠️ Khôi phục từ bản sao lưu** thì ngược lại — nó *thay thế* toàn bộ. Chỉ
dùng khi dữ liệu máy này hỏng, đừng dùng để đồng bộ.

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
  lib/alarm.ts     chuông báo hết giờ, mở khoá tiếng từ lần chạm đầu
  lib/exam.ts      luật đề thi, chấm điểm, phân tích theo chủ đề
  lib/cloud.ts     một lượt đồng bộ: đọc về, gộp ba chiều, ghi lên
  lib/github.ts    đọc/ghi một file trong repo qua GitHub Contents API
  lib/normalise.ts nắn JSON bất kỳ về AppData — dùng chung cho cả ba chỗ đọc file
  lib/sync.ts      luật gộp dữ liệu hai máy
  lib/weakness.ts  xếp hạng chủ đề yếu từ ôn tập + thi thử
  lib/history.ts   lịch sử chấm bài ba ngày gần nhất
  lib/vi.ts        tên chủ đề tiếng Việt, bỏ dấu, từ điển Việt–Nhật cho tìm kiếm
  state/           tầng trạng thái, tự lưu sau 600ms
  state/useSync.ts hẹn nhịp đồng bộ nền
  views/           5 màn hình
  data/catalog.json  danh mục 1609 bài
scripts/
  convert-excel.py Excel → catalog.json + seed.json
  build-answers.py CSV/Excel → answers.json (đáp án thi thử)
  dap-an-pdf.py    bảng đáp án chính thức (PDF) → answers.json
  bao-cao-thieu.py báo cáo câu thiếu và đáp án thiếu, xuất con-thieu.csv
  nap-con-thieu.py con-thieu.csv → đáp án + tiêu đề + số sao
  sua-danh-muc.py  vá kỳ thi / số câu / link cho danh mục
  nap-tieng-viet.py Excel → bản dịch tên bài (nameVi) cho danh mục
  tao-icon-android.py mark.svg → icon hai lớp + ảnh khởi động cho Android
docs/
  DONG-BO-GITHUB.md      bật đồng bộ tự động, từng bước
  SAO-LUU-VA-DONG-BO.md  phương án sao lưu và đồng bộ Android
```

## Giấy phép

MIT
