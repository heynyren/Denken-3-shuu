# Bật đồng bộ tự động qua GitHub

Mất khoảng **3 phút**, làm một lần cho cả máy tính lẫn điện thoại.

Kết quả: bạn ôn bài trên điện thoại lúc đi tàu, về mở máy tính là đã có sẵn —
không phải xuất file, không phải gửi cho chính mình.

---

## Vì sao GitHub chứ không phải Google Drive

Drive cần một dự án Google Cloud, màn hình đồng ý, rồi **hai** Client ID; riêng
client Android còn khoá theo vân tay SHA-1 của khoá ký APK, nghĩa là phải tạo
khoá ký trước rồi mới xin được khoá đăng nhập. Cả dây chuyền đó mất nửa buổi.

GitHub thì chỉ cần một repo trống và một token. Hai máy dùng chung một token,
không dính gì tới chữ ký của bản cài đặt — nên hôm nay bật được luôn.

Bản dựng cho Drive vẫn còn nguyên trong
[DONG-BO-GOOGLE-DRIVE.md](DONG-BO-GOOGLE-DRIVE.md), lúc nào rảnh làm cũng được;
hai đường không đá nhau.

---

## 1. Tạo repo riêng cho dữ liệu

Vào <https://github.com/new>:

| Ô | Điền |
|---|---|
| Repository name | `denken-du-lieu` |
| Visibility | **Private** ← quan trọng nhất |
| Add a README file | **không** tick |

Bấm **Create repository**. Repo trống là đúng, app sẽ tự tạo file trong đó.

> **Đừng dùng chung repo mã nguồn.** File dữ liệu bị ghi lại vài chục lần mỗi
> ngày; trộn vào repo code là lịch sử code ngập rác. Với lại repo code có lúc
> bạn muốn công khai, còn ghi chú ôn thi thì không.

## 2. Tạo token

Vào <https://github.com/settings/personal-access-tokens/new>
(Settings → Developer settings → Personal access tokens → **Fine-grained tokens**):

| Ô | Điền |
|---|---|
| Token name | `denken-dong-bo` |
| Expiration | 1 năm, hoặc No expiration nếu ngại phải làm lại |
| Repository access | **Only select repositories** → chọn `denken-du-lieu` |
| Permissions → Repository permissions → **Contents** | **Read and write** |

Các quyền khác để nguyên. Bấm **Generate token**, rồi **chép ngay chuỗi
`github_pat_…`** — đóng trang là không xem lại được nữa.

> Chọn **Only select repositories** chứ đừng chọn All repositories. Token này
> nằm trên hai máy; lỡ lộ thì nó chỉ mở được đúng repo dữ liệu, không đụng tới
> repo nào khác của bạn.

## 3. Bật trong app

Trên **máy tính**, vào **Cài đặt → Đồng bộ tự động qua GitHub**:

1. **Repo riêng tư**: `tài-khoản-github-của-bạn/denken-du-lieu`
2. **Token GitHub**: dán chuỗi vừa chép
3. Bấm **🔌 Kiểm tra kết nối** — phải hiện *"Kết nối được. Repo đang là Private,
   đúng rồi."* Nút này cũng là nút lưu.
4. Bấm **▶ Bật đồng bộ**, rồi **🔄 Đồng bộ ngay**

Nếu nó báo repo đang **công khai** thì dừng lại, vào GitHub chuyển sang Private
đã rồi hãy bật — ghi chú của bạn không nên để ai cũng đọc được.

## 4. Làm y hệt trên điện thoại

Cùng repo, cùng token. Lần đồng bộ đầu tiên trên điện thoại sẽ kéo toàn bộ dữ
liệu từ máy tính về.

Xong. Từ giờ app tự chạy, bạn không phải làm gì nữa.

---

## Lỡ bật ở điện thoại trước thì sao

Không sao cả, cứ bật ở máy tính rồi bấm **🔄 Đồng bộ ngay**. Máy tính sẽ **không**
bị bản trên GitHub đè lên.

Lý do: đây là gộp chứ không phải tải về. Sổ trên điện thoại mới cài là sổ trắng,
không có bản ghi nào — mà thứ không có thì không xoá được thứ đang có. Lượt gộp
đầu tiên ở máy tính lấy hợp của hai bên: 500 bài của máy tính còn nguyên cả ghi
chú lẫn cấp độ ôn, cộng thêm mấy bài bạn lỡ chấm trên điện thoại.

Cài đặt (mục tiêu ngày, ngày thi) cũng theo máy tính, không bị mặc định của điện
thoại đè. Lần đồng bộ sau, điện thoại nhận hết về và hai bên hết lệch.

Có kiểm thử dựng đúng kịch bản này, xem mục 24 trong `scripts/kiem-thu-gop.ts`.

Muốn chắc hơn nữa thì trước khi bấm, vào **Cài đặt → Xuất bản sao lưu (JSON)**
một cái cất đó. Mất một giây, và nếu có gì bất ngờ thì bạn còn đường lùi.

### Một chỗ hơi thiệt

Ngày nào cả hai máy cùng ôn, mà đó là **lần đồng bộ đầu tiên**, thì số bài của
ngày đó lấy bên lớn hơn chứ không cộng lại — máy tính 12 bài, điện thoại 2 bài
thì ra 12 chứ không phải 14. Vì chưa có mốc gốc để biết phần nào là mới, thà
thiếu còn hơn thổi phồng: con số thổi phồng làm sai cả chuỗi ngày liên tiếp lẫn
mọi biểu đồ, mà thổi phồng rồi thì không gỡ lại được. Từ lần thứ hai trở đi đã
có mốc gốc nên cộng đúng.

## App tự chạy lúc nào

| Lúc nào | Vì sao |
|---|---|
| Mở app | Ngồi vào máy là thấy phần đã làm trên điện thoại tối qua |
| Quay lại app | Cầm điện thoại lên là có bản mới nhất |
| Mỗi 5 phút | Máy này không sửa gì, nhưng máy kia thì có |
| Bấm **🔄 Đồng bộ ngay** | Không phải chờ |

Chuyển qua chuyển lại cửa sổ liên tục cũng không gọi mạng dồn dập: hai lần chạy
tự động cách nhau ít nhất một phút.

## Nó gộp thế nào

Vẫn đúng bộ luật ở [SAO-LUU-VA-DONG-BO.md](SAO-LUU-VA-DONG-BO.md) mục 6, lần này
là gộp **ba chiều** thật sự: app cất riêng một **bản chụp của lần đồng bộ trước**
(`sync-base.json`) nên phân biệt được "bên kia vừa thêm" với "bên này vừa xoá" —
thứ mà gộp bằng file tay không làm được.

- Mỗi bài lấy bản có `updatedAt` mới hơn.
- Số bài ôn từng ngày = bản trên mạng **cộng** phần mới của máy này.
- Huy hiệu, lượt thi thử: gộp hết, giữ mốc sớm nhất.

Hai máy ghi cùng một lúc thì sao? GitHub gắn cho mỗi bản một mã `sha`, ghi mà
nộp `sha` cũ là bị từ chối. Gặp vậy app **đọc lại, gộp lại, ghi lại** — thử tối
đa ba lần. Không bao giờ ghi đè bừa lên phần của máy kia.

## Những chỗ phải nói thẳng

- **Ảnh đính kèm không đi theo.** Chỉ tiến độ, ghi chú, link tham khảo và lịch
  sử thi. Ảnh vẫn nằm ở máy nào chụp nó.
- **Token nằm ngoài `data.json`**, trong `sync-config.json` cạnh đó. Nên file
  bạn xuất ra, chép sang Drive hay gửi qua Zalo đều không mang theo token. Đây
  là chủ ý, và có kiểm thử canh.
- **Sửa cùng một bài trên hai máy khi cả hai đang ngoại tuyến**: bên có mốc mới
  hơn thắng, bên kia mất. App có đếm và báo số bài rơi vào cảnh đó.
- **Đây là đồng bộ theo nhịp**, không phải thời gian thực.
- File trên GitHub mà hỏng thì app **dừng lại và báo**, không ghi đè lên — ghi
  đè là xoá luôn dữ liệu của máy kia.

## Khi có lỗi

| App báo | Làm gì |
|---|---|
| Token sai hoặc đã hết hạn | Tạo token mới ở bước 2, dán lại |
| Token không đủ quyền | Token thiếu **Contents: Read and write** |
| Không thấy repo | Sai tên repo, hoặc token chưa được cấp quyền cho đúng repo đó |
| GitHub tạm chặn vì gọi quá nhiều | Chờ một lúc; hạn ngạch là 5000 lượt/giờ, dùng bình thường không bao giờ chạm |
| File trên GitHub không đọc được | Vào repo xem `data.json`, xoá nó đi rồi đồng bộ lại từ máy còn dữ liệu tốt |

## Đổi token, hoặc thôi không dùng nữa

Xoá token ở <https://github.com/settings/tokens?type=beta> là hai máy mất quyền
ghi ngay lập tức, dữ liệu trong app vẫn còn nguyên. Muốn tắt hẳn thì bấm
**⏸ Tắt đồng bộ** trong Cài đặt.
