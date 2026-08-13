#!/usr/bin/env python3
"""Sinh toàn bộ icon và ảnh khởi động cho bản Android từ src/assets/mark.svg.

Vì sao phải có script này
-------------------------
Thư mục android/ được dựng từ khuôn mẫu của một app cũ, nên mang theo nguyên bộ
icon của app đó. Đổi bằng tay thì phải sửa 26 file ở 16 thư mục, lần sau đổi
lại quên mất một cái. Chạy script này là ra hết, luôn khớp với icon bản Windows
vì cả hai cùng vẽ từ một file SVG.

Icon Android không phải chỉ một ảnh
-----------------------------------
Từ Android 8 trở đi, icon gồm HAI lớp chồng lên nhau, mỗi lớp 108dp, rồi hệ
điều hành cắt theo hình nó thích — tròn, vuông bo, giọt nước, tuỳ hãng máy:

    nền (background)  ← nền chuyển màu xanh đêm + vòng hồ quang
    hình (foreground) ← chú thợ điện, được phóng to thu nhỏ khi bạn chạm vào

Chỗ dễ sai nhất: chỉ có **72dp ở giữa** là chắc chắn nhìn thấy, 18dp mỗi bên có
thể bị cắt. Nên nhân vật phải thu lại nằm gọn trong vùng đó — trừ cái áo, cố ý
kéo dài quá đáy để dù hệ điều hành cắt kiểu gì cũng không hở ra một khoảng
trống dưới chân.

Máy Android cũ (dưới bản 8) không hiểu hai lớp, nên vẫn phải kèm ảnh vuông và
ảnh tròn dựng sẵn.

Chạy:  python3 scripts/tao-icon-android.py
"""

from __future__ import annotations

import io
import re
from pathlib import Path

import cairosvg
from PIL import Image, ImageDraw

GOC = Path(__file__).resolve().parent.parent
NGUON = GOC / "src/assets/mark.svg"
RES = GOC / "android/app/src/main/res"

# Mật độ màn hình Android. Icon 48dp, hai lớp 108dp.
MAT_DO = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}

# Ảnh khởi động: dọc và ngang, đúng kích thước khuôn mẫu Capacitor sinh ra.
SPLASH_DOC = {"mdpi": (320, 480), "hdpi": (480, 800), "xhdpi": (720, 1280),
              "xxhdpi": (960, 1600), "xxxhdpi": (1280, 1920)}
SPLASH_NGANG = {k: (h, w) for k, (w, h) in SPLASH_DOC.items()}

# Vùng chắc chắn nhìn thấy của icon hai lớp: 72dp ở giữa khung 108dp.
TỈ_LỆ_AN_TOÀN = 72 / 108


def đọc_nguồn() -> tuple[str, str, str]:
    """Cắt mark.svg làm ba phần: phần defs, phần nền, phần nhân vật."""
    svg = NGUON.read_text(encoding="utf-8")

    defs = svg[svg.index("<defs>"): svg.index("</defs>") + len("</defs>")]

    than = svg[svg.index('<g clip-path="url(#frame)">'): svg.rindex("</g>")]
    than = than[than.index(">") + 1:]

    # Nền = hai lớp chuyển màu + vòng hồ quang; phần còn lại là nhân vật.
    mốc = than.index("<!-- ÁO BẢO HỘ -->")
    return defs, than[:mốc], than[mốc:]


def kéo_dài_áo(nhân_vật: str) -> str:
    """Kéo vạt áo xuống quá đáy khung.

    Hai đường viền của áo kết thúc ở y=512 vì bản gốc bị khung bo góc cắt ngang
    đúng chỗ đó. Icon Android thì hệ điều hành tự cắt theo hình của nó, cắt ở
    đâu không biết trước — để nguyên 512 là có máy hiện ra một khoảng trống dưới
    chân nhân vật. Kéo xuống 700 thì cắt kiểu gì cũng vẫn kín.

    Chỉ đụng vào đúng hai dòng vẽ thân áo, và trong hai dòng đó mọi số 512 đều
    là toạ độ dọc — nên thay thẳng là an toàn.
    """
    ra = []
    for dòng in nhân_vật.split("\n"):
        if "M100 512 Q110 418" in dòng or "L300 512 L212 512 Z" in dòng:
            dòng = dòng.replace("512", "700")
        ra.append(dòng)
    return "\n".join(ra)


def vẽ(svg: str, cạnh: int) -> Image.Image:
    png = cairosvg.svg2png(bytestring=svg.encode("utf-8"),
                           output_width=cạnh, output_height=cạnh)
    return Image.open(io.BytesIO(png)).convert("RGBA")


def svg_nền(defs: str, nền: str) -> str:
    """Lớp nền: tràn kín khung, không bo góc — hệ điều hành tự bo lấy."""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">{defs}{nền}</svg>'


def svg_nhân_vật(defs: str, nhân_vật: str) -> str:
    """Lớp hình: thu nhân vật vào vùng an toàn, chừa áo tràn xuống đáy."""
    # Thu nhỏ đúng bằng tỉ lệ vùng an toàn, rồi đẩy lên cho đầu nằm ở 1/4 trên.
    s = TỈ_LỆ_AN_TOÀN
    # Đỉnh mũ ở y=138 trong bản gốc; đưa nó về y=120 của khung mới.
    ty = 120 - 138 * s
    tx = 256 - 256 * s
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'
        f"{defs}"
        f'<g transform="translate({tx:.2f} {ty:.2f}) scale({s:.4f})">'
        f"{kéo_dài_áo(nhân_vật)}"
        "</g></svg>"
    )


def svg_đầy_đủ() -> str:
    """Nguyên icon như bản Windows, kể cả khung bo góc."""
    return NGUON.read_text(encoding="utf-8")


def bo_tròn(anh: Image.Image) -> Image.Image:
    """Cắt thành hình tròn, cho máy Android cũ dùng icon tròn."""
    mặt_nạ = Image.new("L", anh.size, 0)
    ImageDraw.Draw(mặt_nạ).ellipse((0, 0, anh.size[0] - 1, anh.size[1] - 1), fill=255)
    ra = anh.copy()
    ra.putalpha(mặt_nạ)
    return ra


def ghi(anh: Image.Image, đường_dẫn: Path) -> None:
    đường_dẫn.parent.mkdir(parents=True, exist_ok=True)
    anh.save(đường_dẫn, "PNG", optimize=True)
    print(f"  {đường_dẫn.relative_to(GOC)}  {anh.size[0]}×{anh.size[1]}")


def làm_splash(defs: str, nền: str, nhân_vật: str, kích: tuple[int, int]) -> Image.Image:
    """Ảnh khởi động: nền xanh đêm trải kín, icon đặt giữa."""
    rộng, cao = kích
    # Lấy màu nền đậm nhất của icon làm nền cả màn hình, cho liền mạch với app.
    khung = Image.new("RGBA", (rộng, cao), (3, 7, 13, 255))

    # Nền chuyển màu trải theo cạnh dài để không bị kéo méo.
    cạnh_nền = max(rộng, cao)
    lớp_nền = vẽ(svg_nền(defs, nền), cạnh_nền)
    khung.alpha_composite(lớp_nền, ((rộng - cạnh_nền) // 2, (cao - cạnh_nền) // 2))

    # Icon chiếm khoảng một phần ba cạnh ngắn — đủ thấy, không lấn át.
    cạnh_icon = int(min(rộng, cao) * 0.34)
    icon = vẽ(svg_đầy_đủ(), cạnh_icon)
    khung.alpha_composite(icon, ((rộng - cạnh_icon) // 2, (cao - cạnh_icon) // 2))
    return khung.convert("RGB").convert("RGBA")


def main() -> None:
    defs, nền, nhân_vật = đọc_nguồn()

    print("Icon hai lớp (Android 8 trở lên):")
    for tên, hệ_số in MAT_DO.items():
        cạnh = int(round(108 * hệ_số))
        ghi(vẽ(svg_nền(defs, nền), cạnh), RES / f"mipmap-{tên}/ic_launcher_background.png")
        ghi(vẽ(svg_nhân_vật(defs, nhân_vật), cạnh),
            RES / f"mipmap-{tên}/ic_launcher_foreground.png")

    print("Icon dựng sẵn (Android cũ):")
    for tên, hệ_số in MAT_DO.items():
        cạnh = int(round(48 * hệ_số))
        đủ = vẽ(svg_đầy_đủ(), cạnh)
        ghi(đủ, RES / f"mipmap-{tên}/ic_launcher.png")
        ghi(bo_tròn(đủ), RES / f"mipmap-{tên}/ic_launcher_round.png")

    print("Ảnh khởi động:")
    for tên, kích in SPLASH_DOC.items():
        ghi(làm_splash(defs, nền, nhân_vật, kích), RES / f"drawable-port-{tên}/splash.png")
    for tên, kích in SPLASH_NGANG.items():
        ghi(làm_splash(defs, nền, nhân_vật, kích), RES / f"drawable-land-{tên}/splash.png")
    # Bản không ghi mật độ, dùng khi máy không khớp thư mục nào ở trên.
    ghi(làm_splash(defs, nền, nhân_vật, (480, 320)), RES / "drawable/splash.png")

    print("\nXong. Nhớ chạy `npm run android:sync` trước khi đóng gói APK.")


if __name__ == "__main__":
    main()
