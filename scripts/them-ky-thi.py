#!/usr/bin/env python3
"""Thêm một kỳ thi mới vào danh mục.

    python3 scripts/them-ky-thi.py scripts/ky-thi-r8-1.json --thu   # xem trước
    python3 scripts/them-ky-thi.py scripts/ky-thi-r8-1.json         # ghi thật

Vì sao có script này
--------------------
Danh mục gốc dựng từ file Excel (`convert-excel.py`). Nhưng kỳ thi vừa diễn ra
thì chưa có trong Excel — muốn ôn ngay thì phải thêm tay. Thêm tay trực tiếp vào
`catalog.json` (1609 bài, một dòng JSON dài) là đường chắc chắn dẫn tới sai sót
lặng lẽ: trùng `id`, lệch số câu, sai link. Nên gói thành script có kiểm tra.

Link suy ra chứ không chép
--------------------------
denken-ou.com đặt link theo đúng một công thức: `{môn}{kỳ}-{số câu}`, ví dụ
`kikair8-1-13` = 機械 令和8年度上期 問13. Công thức này đã được đối chiếu với
toàn bộ 1609 bài đang có — **không lệch bài nào** — nên dựng link từ số câu là
việc chắc chắn, không phải phỏng đoán. Script tự dựng, không ai gõ tay link.

Cái gì KHÔNG có ở đây
---------------------
**Đáp án và số sao độ khó.** Hai thứ đó không suy ra được từ tiêu đề, mà đoán
bừa thì tệ hơn hẳn để trống: đáp án sai làm người học thuộc sai, còn sao bịa làm
lệch cả bộ lọc độ khó. Nên bài mới vào với `stars: 0`, và không đụng tới
`answers.json`. Điền sau bằng đường có sẵn:

    python3 scripts/bao-cao-thieu.py --csv        # xuất scripts/con-thieu.csv
    (điền cột dap_an_1 / dap_an_2 / sao)
    python3 scripts/nap-con-thieu.py scripts/con-thieu.csv

Chế độ thi thử đã biết cách sống chung với bài chưa có đáp án: nó đếm vào mục
"chưa có đáp án, không tính điểm" và quy điểm về thang 100 trên phần chấm được,
chứ không coi là làm sai.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "src" / "data" / "catalog.json"

SUBJECTS = ("riron", "denryoku", "kikai", "houki")
# Số câu đúng của đề thật. Lệch là dữ liệu vào có vấn đề, dừng ngay.
SO_CAU = {"riron": 18, "denryoku": 17, "kikai": 18, "houki": 13}


def nap(duong_dan: Path) -> dict:
    data = json.loads(duong_dan.read_text(encoding="utf8"))
    for khoa in ("exam", "slug", "mon"):
        if khoa not in data:
            sys.exit(f"Thiếu khoá '{khoa}' trong {duong_dan}")
    return data


def main() -> None:
    doi = [a for a in sys.argv[1:] if not a.startswith("--")]
    thu = "--thu" in sys.argv
    if not doi:
        sys.exit(__doc__)

    data = nap(Path(doi[0]))
    exam, slug = data["exam"], data["slug"]

    catalog = json.loads(CATALOG.read_text(encoding="utf8"))
    items = catalog["items"]

    if any(i["exam"] == exam for i in items):
        sys.exit(f"Kỳ {exam} đã có trong danh mục rồi — không thêm chồng lên.")

    da_co = {i["id"] for i in items}
    # `no` chỉ là thứ tự trong sổ; kỳ mới chưa có chỗ trong mạch chủ đề của
    # file Excel nên xếp nối đuôi, đừng chen vào giữa làm xô lệch bài cũ.
    tiep = {s: max((i["no"] for i in items if i["subject"] == s), default=0) for s in SUBJECTS}

    them = []
    for mon, rows in data["mon"].items():
        if mon not in SUBJECTS:
            sys.exit(f"Môn lạ: {mon}")
        if len(rows) != SO_CAU[mon]:
            sys.exit(f"{mon}: có {len(rows)} câu, đề thật {SO_CAU[mon]} câu.")

        for so_cau, row in enumerate(rows, start=1):
            name, category, topic, name_vi = row
            ma = f"{mon}{slug}-{so_cau}"
            mid = f"{mon}:{ma}"
            if mid in da_co:
                sys.exit(f"Trùng id: {mid}")
            tiep[mon] += 1
            them.append({
                "id": mid,
                "subject": mon,
                "topic": topic,
                "no": tiep[mon],
                "name": name,
                # 0 = chưa biết độ khó. Bộ lọc sao 1–5 sẽ không bắt phải bài
                # này, đúng ý: chưa biết thì đừng xếp nhầm vào mức nào cả.
                "stars": 0,
                "category": category,
                "exam": exam,
                "question": f"問{so_cau}",
                "url": f"https://denken-ou.com/{ma}/",
                "nameVi": name_vi,
            })

    print(f"Thêm {len(them)} bài cho kỳ {exam}:")
    for mon in SUBJECTS:
        n = sum(1 for i in them if i["subject"] == mon)
        if n:
            mau = next(i for i in them if i["subject"] == mon)
            print(f"  {mon:9s} {n:2d} câu   ví dụ: {mau['url']}")

    if thu:
        print("\n(--thu: chưa ghi gì cả)")
        return

    catalog["items"] = items + them
    CATALOG.write_text(
        json.dumps(catalog, ensure_ascii=False, separators=(",", ":")),
        encoding="utf8",
    )
    print(f"\nĐã ghi {CATALOG.relative_to(ROOT)} — tổng {len(catalog['items'])} bài.")
    print("Còn thiếu đáp án và số sao; chạy:")
    print("  python3 scripts/bao-cao-thieu.py --csv")


if __name__ == "__main__":
    main()
