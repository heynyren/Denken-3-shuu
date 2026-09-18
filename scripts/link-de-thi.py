#!/usr/bin/env python3
"""Link tới đề thi PDF chính thức của 電気技術者試験センター.

    python3 scripts/link-de-thi.py --xuat          # xuất CSV trống để điền
    python3 scripts/link-de-thi.py --nap FILE.csv  # nạp CSV đã điền vào app
    python3 scripts/link-de-thi.py --nap FILE.csv --thu   # xem trước, không ghi

Vì sao là LINK chứ không phải file
----------------------------------
Đóng gói 100 file PDF vào app thì bản cài và APK nặng thêm đúng bằng tổng dung
lượng đề — APK phình từ 6 MB lên hơn trăm MB, và mỗi lần build lại tải lên chừng
đó. Giữ link thì app không nặng thêm một byte nào.

Đổi lại, link phụ thuộc vào việc trung tâm còn để file trên mạng. Nên app **giữ
nguyên cả link denken-ou.com** bên cạnh: trung tâm xoá đề thì vẫn còn đường xem.
Và ai muốn chắc ăn hơn nữa thì bỏ file PDF vào thư mục `de-thi/` — app ưu tiên
file trên máy trước, xem `de-thi/README.md`.

Một dòng CSV là một cặp (kỳ thi, môn)
-------------------------------------
Đề thi của trung tâm tách theo môn, mỗi môn một file. 25 kỳ × 4 môn = 100 dòng.
Điền được dòng nào nạp dòng đó, để trống thì bỏ qua chứ không xoá cái đang có.
"""

from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "src" / "data" / "catalog.json"
RA = ROOT / "src" / "data" / "de-thi-link.json"
CSV_MAU = ROOT / "scripts" / "link-de-thi.csv"

MON_JA = {"riron": "理論", "denryoku": "電力", "kikai": "機械", "houki": "法規"}
JA_MON = {v: k for k, v in MON_JA.items()}
THU_TU = ["riron", "denryoku", "kikai", "houki"]

COT = ["ky_thi", "mon", "ma_ky", "link_pdf", "ghi_chu"]


def thu_tu_ky_thi(exam: str) -> int:
    """Giống `examOrder()` bên src/lib/exam.ts — cùng một quy tắc, đừng để lệch.

    Kỳ mới nhất lên đầu, vì đó là kỳ người ta đi tìm đề trước.
    """
    m = re.match(r"^([RH])0*(\d+)", exam)
    if not m:
        return -1
    era = 1 if m.group(1) == "R" else 0
    nam = int(m.group(2))
    nua = 2 if "下" in exam else 1 if "上" in exam else 0
    return era * 100_000 + nam * 10 + nua


def doc_danh_muc() -> tuple[list[str], dict[str, str]]:
    """Trả về danh sách kỳ thi (mới nhất trước) và mã kỳ của từng kỳ."""
    items = json.loads(CATALOG.read_text(encoding="utf8"))["items"]

    dem: dict[str, dict[str, int]] = {}
    thu_tu_ky: list[str] = []
    for bai in items:
        if bai["exam"] not in thu_tu_ky:
            thu_tu_ky.append(bai["exam"])
        slug = re.search(r"denken-ou\.com/([^/]+)", bai["url"])
        if not slug:
            continue
        goc = re.sub(r"-\d+$", "", slug.group(1))
        if not goc.startswith(bai["subject"]):
            continue  # link sai môn: không tin
        ma = goc[len(bai["subject"]):]
        if ma:
            dem.setdefault(bai["exam"], {})
            dem[bai["exam"]][ma] = dem[bai["exam"]].get(ma, 0) + 1

    ma_ky = {
        ky: max(d.items(), key=lambda kv: kv[1])[0] for ky, d in dem.items()
    }
    thu_tu_ky.sort(key=thu_tu_ky_thi, reverse=True)
    return thu_tu_ky, ma_ky


def xuat() -> None:
    thu_tu_ky, ma_ky = doc_danh_muc()
    cu = {}
    if RA.exists():
        cu = json.loads(RA.read_text(encoding="utf8")).get("links", {})

    dong = []
    for ky in thu_tu_ky:
        for mon in THU_TU:
            khoa = f"{ky}|{mon}"
            dong.append({
                "ky_thi": ky,
                "mon": MON_JA[mon],
                "ma_ky": ma_ky.get(ky, ""),
                "link_pdf": cu.get(khoa, ""),
                "ghi_chu": "",
            })

    with CSV_MAU.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=COT)
        w.writeheader()
        w.writerows(dong)

    da_co = sum(1 for d in dong if d["link_pdf"])
    print(f"Đã xuất {CSV_MAU.relative_to(ROOT)} — {len(dong)} dòng, {da_co} dòng đã có link.")
    print("Điền cột link_pdf rồi nạp lại:")
    print(f"  python3 scripts/link-de-thi.py --nap {CSV_MAU.relative_to(ROOT)}")


# Số hiệu file của từng môn trong đường dẫn của trung tâm: `…_ch_third_q03.pdf`.
# Thứ tự này khớp với thứ tự môn trên đề thật, và được ba link điền tay của kỳ
# R08上 xác nhận (q01 理論, q02 電力, q03 機械) nên q04 là 法規.
SO_HIEU_MON = {"riron": 1, "denryoku": 2, "kikai": 3, "houki": 4}

MAU_LINK = re.compile(r"^(?P<dau>.*_q)(?P<so>\d+)(?P<duoi>\.pdf)$")


def noi_suy(dong: list[dict]) -> tuple[int, list[str], list[str]]:
    """Điền link các môn còn trống, suy từ link đã có của cùng kỳ thi.

    Trung tâm đặt tên theo `{ngày}_ch_third_q{số môn}.pdf`, cùng một ngày cho cả
    bốn môn của một kỳ. Nên biết link của một môn là dựng được ba môn kia.

    Chỉ điền vào chỗ TRỐNG. Link đã điền tay thì không đụng, mà còn dùng để
    **đối chiếu**: nếu link tay khác link suy ra thì giả định về số hiệu môn đang
    sai ở đâu đó, và cái đó phải báo ra chứ không được lặng lẽ ghi đè.
    """
    theo_ky: dict[str, list[dict]] = {}
    for r in dong:
        theo_ky.setdefault(r["ky_thi"], []).append(r)

    them = 0
    lech: list[str] = []
    khong_suy_duoc: list[str] = []

    for ky, rows in theo_ky.items():
        mau = None
        for r in rows:
            link = (r.get("link_pdf") or "").strip()
            m = MAU_LINK.match(link)
            mon = JA_MON.get((r.get("mon") or "").strip())
            if m and mon in SO_HIEU_MON:
                rong = len(m.group("so"))
                mau = (m.group("dau"), rong, m.group("duoi"))
                break

        if mau is None:
            # Kỳ không có link nào: trung tâm chưa đăng đề kỳ đó (H20 đổ về
            # trước). Không có gì để suy, và suy bừa thì ra 88 link chết.
            if any((r.get("link_pdf") or "").strip() for r in rows):
                khong_suy_duoc.append(ky)
            continue

        dau, rong, duoi = mau
        for r in rows:
            mon = JA_MON.get((r.get("mon") or "").strip())
            if mon not in SO_HIEU_MON:
                continue
            can = f"{dau}{SO_HIEU_MON[mon]:0{rong}d}{duoi}"
            co = (r.get("link_pdf") or "").strip()
            if not co:
                r["link_pdf"] = can
                r["ghi_chu"] = (r.get("ghi_chu") or "").strip() or "nội suy"
                them += 1
            elif co != can:
                lech.append(f"{ky} {r['mon']}: điền tay {co}  ≠  suy ra {can}")

    return them, lech, khong_suy_duoc


def nap(duong_dan: Path, thu: bool) -> None:
    thu_tu_ky, _ = doc_danh_muc()
    ky_co = set(thu_tu_ky)

    with duong_dan.open(encoding="utf-8-sig", newline="") as f:
        dong = list(csv.DictReader(f))

    suy_ra: set[str] = set()
    if "--noi-suy" in sys.argv:
        them, lech, khong = noi_suy(dong)
        print(f"Nội suy: điền thêm {them} link từ link đã có của cùng kỳ.")
        for r in dong:
            if (r.get("ghi_chu") or "").strip() == "nội suy":
                suy_ra.add(f"{r['ky_thi']}|{JA_MON.get(r['mon'], r['mon'])}")
        if khong:
            print(f"  {len(khong)} kỳ không suy được (link không theo mẫu): {', '.join(khong)}")
        if lech:
            # Đây là tín hiệu giả định sai, không phải chuyện nhỏ: dừng lại.
            print(f"\nDỪNG — {len(lech)} link điền tay KHÁC link suy ra:")
            for m in lech:
                print(f"  {m}")
            print("\nGiả định về số hiệu môn (q01 理論 / q02 電力 / q03 機械 / q04 法規)")
            print("đang sai ở đâu đó. Sửa lại rồi chạy lại, đừng nạp bừa.")
            sys.exit(1)
        print()

    links: dict[str, str] = {}
    if RA.exists():
        links = json.loads(RA.read_text(encoding="utf8")).get("links", {})

    them = doi = bo_qua = 0
    loi: list[str] = []

    for i, r in enumerate(dong, start=2):
        link = (r.get("link_pdf") or "").strip()
        if not link:
            bo_qua += 1
            continue

        ky = (r.get("ky_thi") or "").strip()
        mon_ja = (r.get("mon") or "").strip()
        mon = JA_MON.get(mon_ja) or (mon_ja if mon_ja in MON_JA else None)

        if ky not in ky_co:
            loi.append(f"dòng {i}: kỳ thi '{ky}' không có trong danh mục")
            continue
        if not mon:
            loi.append(f"dòng {i}: môn '{mon_ja}' không hợp lệ")
            continue
        # Chỉ nhận https. http trần thì trình duyệt điện thoại chặn, mà link tải
        # về qua mạng không mã hoá cũng không nên.
        if not re.match(r"^https://", link):
            loi.append(f"dòng {i}: link phải bắt đầu bằng https:// — '{link[:48]}'")
            continue

        khoa = f"{ky}|{mon}"
        if khoa in links and links[khoa] != link:
            doi += 1
        elif khoa not in links:
            them += 1
        links[khoa] = link

    print(f"{len(dong)} dòng: thêm {them}, đổi {doi}, để trống {bo_qua}")
    if loi:
        print(f"\nKHÔNG nạp {len(loi)} dòng:")
        for m in loi:
            print(f"  {m}")

    if thu:
        print("\n(--thu: chưa ghi gì cả)")
        return

    # Giữ lại danh sách link nội suy. App không đọc trường này, nhưng sáu tháng
    # sau mà có link chết thì cần biết ngay link nào là người điền, link nào là
    # máy suy ra — hai loại đó tìm nguyên nhân theo hai hướng khác nhau.
    cu_suy = set()
    if RA.exists():
        cu_suy = set(json.loads(RA.read_text(encoding="utf8")).get("noiSuy", []))
    RA.write_text(
        json.dumps(
            {
                "links": dict(sorted(links.items())),
                "noiSuy": sorted(cu_suy | suy_ra),
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf8",
    )
    print(f"\nĐã ghi {RA.relative_to(ROOT)} — {len(links)} link.")
    if loi:
        sys.exit(1)


def main() -> None:
    doi = sys.argv[1:]
    if "--xuat" in doi:
        xuat()
        return
    if "--nap" in doi:
        vi_tri = doi.index("--nap")
        if vi_tri + 1 >= len(doi):
            sys.exit("Thiếu đường dẫn file CSV sau --nap")
        nap(Path(doi[vi_tri + 1]), thu="--thu" in doi)
        return
    sys.exit(__doc__)


if __name__ == "__main__":
    main()
