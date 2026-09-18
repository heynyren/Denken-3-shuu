#!/usr/bin/env python3
"""Sắp lại thứ tự bài trong danh mục sau khi thêm kỳ thi mới.

    python3 scripts/sap-lai-thu-tu.py --thu   # xem trước, không ghi
    python3 scripts/sap-lai-thu-tu.py         # ghi lại catalog.json

Vì sao cần
----------
Màn Danh sách bài **không sắp gì cả** — nó hiện đúng thứ tự các phần tử nằm
trong `catalog.json`. Nên thứ tự trong file chính là thứ tự người dùng nhìn thấy.

Thứ tự ấy có quy luật, đọc ra được từ chính dữ liệu gốc:

  1. Bốn môn xen kẽ nhau theo `no`: 理論1, 電力1, 機械1, 法規1, 理論2, …
  2. Trong mỗi môn, bài gom theo **chủ đề**.
  3. Trong mỗi chủ đề, **kỳ thi mới nhất đứng trước**, rồi tới số câu tăng dần.

`them-ky-thi.py` nối bài mới vào cuối mảng và cho `no` chạy tiếp sau số lớn
nhất. Đúng về mặt "không đụng vào bài cũ", nhưng sai về chỗ đứng: kỳ mới nhất
rơi xuống tận đáy danh sách, trong khi quy luật (3) đòi nó phải đứng đầu mỗi
nhóm chủ đề.

Script này đánh số lại `no` theo đúng ba quy luật trên rồi dựng lại mảng.

Không đụng tới `id`
-------------------
Tiến độ ôn tập của người dùng khoá theo `id`. Ở đây chỉ đổi `no` và thứ tự phần
tử — hai thứ thuần tuý để hiển thị. Đổi id là mất lịch sử học, nên không bao giờ.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "src" / "data" / "catalog.json"
SUBJECTS = ("riron", "denryoku", "kikai", "houki")


def thu_tu_ky(exam: str) -> int:
    """Giống `examOrder()` bên src/lib/exam.ts. Số lớn hơn = kỳ mới hơn."""
    m = re.match(r"^([RH])0*(\d+)", exam or "")
    if not m:
        return -1
    era = 1 if m.group(1) == "R" else 0
    nam = int(m.group(2))
    nua = 2 if "下" in exam else 1 if "上" in exam else 0
    return era * 100_000 + nam * 10 + nua


def so_cau(q: str) -> int:
    m = re.search(r"(\d+)", q or "")
    return int(m.group(1)) if m else 0


def main() -> None:
    thu = "--thu" in sys.argv
    catalog = json.loads(CATALOG.read_text(encoding="utf8"))
    items = catalog["items"]

    truoc = [i["id"] for i in items]

    moi: list[dict] = []
    for mon in SUBJECTS:
        cua_mon = [i for i in items if i["subject"] == mon]

        # Giữ nguyên thứ tự chủ đề đang có: đọc ra theo `no` hiện tại, chứ không
        # sắp theo bảng chữ cái. Thứ tự này đến từ file Excel gốc và người dùng
        # đã quen mắt với nó — đổi là xáo trộn cả danh sách vì một kỳ thi mới.
        thu_tu_chu_de: dict[str, int] = {}
        for i in sorted(cua_mon, key=lambda x: x["no"]):
            thu_tu_chu_de.setdefault(i["topic"], len(thu_tu_chu_de))

        cua_mon.sort(
            key=lambda i: (
                thu_tu_chu_de[i["topic"]],
                -thu_tu_ky(i["exam"]),   # kỳ mới nhất trước
                so_cau(i["question"]),
            )
        )
        for vi_tri, bai in enumerate(cua_mon, start=1):
            bai["no"] = vi_tri
        moi.extend(cua_mon)

    # Dựng lại mảng: bốn môn xen kẽ theo `no`.
    thu_tu_mon = {m: k for k, m in enumerate(SUBJECTS)}
    moi.sort(key=lambda i: (i["no"], thu_tu_mon[i["subject"]]))

    sau = [i["id"] for i in moi]
    assert sorted(truoc) == sorted(sau), "số bài đổi — dừng lại"

    # Đo mức xáo trộn với các bài CŨ.
    #
    # Phải đo TRONG TỪNG MÔN, không đo trên cả mảng. Mảng xen kẽ bốn môn, nên
    # chèn 66 bài mới là nhịp xen kẽ đổi và gần như bài nào cũng "lệch chỗ" —
    # con số đó không nói lên điều gì về việc sắp có đúng hay không.
    #
    # Điều thật sự cần giữ: trong mỗi môn, các bài cũ vẫn đứng đúng thứ tự cũ
    # so với nhau, chỉ có bài mới chen vào đầu từng nhóm chủ đề.
    ky_moi = max(thu_tu_ky(i["exam"]) for i in items)
    print(f"{len(moi)} bài.")
    tat_ca_giu = True
    for mon in SUBJECTS:
        cu_truoc = [i["id"] for i in sorted(
            (x for x in items if x["subject"] == mon and thu_tu_ky(x["exam"]) != ky_moi),
            key=lambda x: x["no"])]
        cu_sau = [i["id"] for i in moi
                  if i["subject"] == mon and thu_tu_ky(i["exam"]) != ky_moi]
        giu = cu_truoc == cu_sau
        tat_ca_giu &= giu
        print(f"  {mon:9s} {len(cu_truoc):4d} bài cũ: "
              f"{'giữ nguyên thứ tự' if giu else 'BỊ XÁO TRỘN'}")
        if not giu:
            lech = [a for a, b in zip(cu_truoc, cu_sau) if a != b]
            print(f"    {len(lech)} bài lệch, ví dụ: {lech[:3]}")
    if not tat_ca_giu:
        print("\nQuy luật sắp đang đọc SAI dữ liệu gốc — dừng lại, đừng ghi đè.")
        sys.exit(1)

    print("\n12 bài đầu danh sách sau khi sắp:")
    for i in moi[:12]:
        print(f"  {i['subject']:9s} no={i['no']:3d} {i['exam']:6s} {i['question']:5s} {i['topic']}")

    if thu:
        print("\n(--thu: chưa ghi gì cả)")
        return

    catalog["items"] = moi
    CATALOG.write_text(
        json.dumps(catalog, ensure_ascii=False, separators=(",", ":")), encoding="utf8"
    )
    print(f"\nĐã ghi {CATALOG.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
