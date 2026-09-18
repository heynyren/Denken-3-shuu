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


def nap(duong_dan: Path, thu: bool) -> None:
    thu_tu_ky, _ = doc_danh_muc()
    ky_co = set(thu_tu_ky)

    with duong_dan.open(encoding="utf-8-sig", newline="") as f:
        dong = list(csv.DictReader(f))

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

    RA.write_text(
        json.dumps({"links": dict(sorted(links.items()))}, ensure_ascii=False, indent=2) + "\n",
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
