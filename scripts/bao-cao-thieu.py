#!/usr/bin/env python3
"""
Báo cáo những chỗ còn thiếu, để biết phải đi tìm cái gì.

Hai loại thiếu, khác hẳn nhau:

  THIẾU CÂU     kỳ thi đó thiếu hẳn câu hỏi trong danh mục — phải bổ sung link
                bài vào file Excel rồi chạy lại convert-excel.py
  THIẾU ĐÁP ÁN  có câu rồi nhưng chưa biết đáp án — điền vào scripts/mau-dap-an.csv
                rồi chạy build-answers.py

Chạy:
    python3 scripts/bao-cao-thieu.py            # tóm tắt
    python3 scripts/bao-cao-thieu.py --chi-tiet # liệt kê từng câu kèm link
    python3 scripts/bao-cao-thieu.py --csv      # xuất scripts/con-thieu.csv
"""

from __future__ import annotations

import csv
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "src" / "data" / "catalog.json"
ANSWERS = ROOT / "src" / "data" / "answers.json"

# Đề thật có bao nhiêu câu mỗi môn
STANDARD: dict[str, list[int]] = {
    "riron": list(range(1, 19)),      # 問1-18 (問17/18 chọn một)
    "denryoku": list(range(1, 18)),   # 問1-17
    "kikai": list(range(1, 19)),      # 問1-18 (問17/18 chọn một)
    "houki": list(range(1, 14)),      # 問1-13
}
JA = {"riron": "理論", "denryoku": "電力", "kikai": "機械", "houki": "法規"}
ORDER = ["riron", "denryoku", "kikai", "houki"]


def exam_rank(exam: str) -> tuple:
    match = re.match(r"^([RH])0*(\d+)", exam)
    if not match:
        return (0, 0, 0)
    era = 1 if match.group(1) == "R" else 0
    half = 2 if "下" in exam else 1 if "上" in exam else 0
    return (era, int(match.group(2)), half)


def question_no(item: dict) -> int | None:
    match = re.search(r"\d+", item.get("question", ""))
    return int(match.group()) if match else None


def main() -> None:
    detail = "--chi-tiet" in sys.argv
    want_csv = "--csv" in sys.argv

    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    try:
        answers = json.loads(ANSWERS.read_text(encoding="utf-8"))["answers"]
    except (FileNotFoundError, KeyError):
        answers = {}

    # exam -> subject -> {số câu: item}
    have: dict[str, dict[str, dict[int, dict]]] = defaultdict(lambda: defaultdict(dict))
    for item in catalog["items"]:
        if not item["exam"]:
            continue
        number = question_no(item)
        if number is None:
            continue
        have[item["exam"]][item["subject"]][number] = item

    exams = sorted(have, key=exam_rank, reverse=True)

    missing_q: list[tuple] = []   # (kỳ, môn, số câu)
    missing_a: list[tuple] = []   # (kỳ, môn, số câu, id, url)

    for exam in exams:
        for subject in ORDER:
            present = have[exam].get(subject, {})
            for number in STANDARD[subject]:
                item = present.get(number)
                if item is None:
                    missing_q.append((exam, subject, number))
                elif item["id"] not in answers:
                    missing_a.append((exam, subject, number, item["id"], item["url"]))

    total_std = sum(len(v) for v in STANDARD.values()) * len(exams)

    print("=" * 66)
    print(f"BÁO CÁO CÒN THIẾU — {len(exams)} kỳ thi, chuẩn {total_std} câu")
    print("=" * 66)
    print()
    print(f"Thiếu hẳn câu hỏi : {len(missing_q):>5} câu  (phải bổ sung link vào Excel)")
    print(f"Thiếu đáp án      : {len(missing_a):>5} câu  (phải tra đáp án)")
    print(f"Đã đủ cả hai      : {total_std - len(missing_q) - len(missing_a):>5} câu")
    print()

    # ---- Bảng theo từng kỳ ----
    print("-" * 66)
    print(f"{'Kỳ thi':<9}{'理論':>12}{'電力':>12}{'機械':>12}{'法規':>12}")
    print(f"{'':9}{'(thiếu câu / thiếu đáp án)':>48}")
    print("-" * 66)

    for exam in exams:
        cells = []
        for subject in ORDER:
            q = sum(1 for e, s, _ in missing_q if e == exam and s == subject)
            a = sum(1 for e, s, *_ in missing_a if e == exam and s == subject)
            cells.append("  ✓  " if q == 0 and a == 0 else f"{q} / {a}")
        print(f"{exam:<9}" + "".join(f"{c:>12}" for c in cells))

    # ---- Chi tiết câu thiếu hẳn ----
    if missing_q:
        print()
        print("-" * 66)
        print("THIẾU HẲN CÂU HỎI — cần tìm link bài rồi thêm vào file Excel")
        print("-" * 66)
        grouped: dict[tuple[str, str], list[int]] = defaultdict(list)
        for exam, subject, number in missing_q:
            grouped[(exam, subject)].append(number)
        for (exam, subject), numbers in sorted(
            grouped.items(), key=lambda kv: (exam_rank(kv[0][0]), kv[0][1]), reverse=True
        ):
            nums = ", ".join(f"問{n}" for n in sorted(numbers))
            print(f"  {exam:<8} {JA[subject]}  thiếu {len(numbers)} câu: {nums}")

    # ---- Chi tiết câu thiếu đáp án ----
    if detail and missing_a:
        print()
        print("-" * 66)
        print("THIẾU ĐÁP ÁN — mở link, tra đáp án, điền vào CSV")
        print("-" * 66)
        for exam, subject, number, item_id, url in missing_a:
            print(f"  {exam:<8} {JA[subject]} 問{number:<3} {url}")

    # ---- Xuất CSV để tiện điền ----
    if want_csv:
        target = ROOT / "scripts" / "con-thieu.csv"
        with target.open("w", encoding="utf-8-sig", newline="") as handle:
            writer = csv.writer(handle)
            writer.writerow(["loai", "ky_thi", "mon", "cau", "id", "link", "dap_an"])
            for exam, subject, number in missing_q:
                writer.writerow(["thieu_cau", exam, JA[subject], f"問{number}", "", "", ""])
            for exam, subject, number, item_id, url in missing_a:
                writer.writerow(
                    ["thieu_dap_an", exam, JA[subject], f"問{number}", item_id, url, ""]
                )
        print()
        print(f"→ Đã xuất {target} ({len(missing_q) + len(missing_a)} dòng)")
        print("  Điền cột `dap_an` cho các dòng thieu_dap_an, rồi chạy:")
        print("      python3 scripts/build-answers.py scripts/con-thieu.csv")

    if not detail and missing_a:
        print()
        print("Xem từng câu thiếu đáp án kèm link:  python3 scripts/bao-cao-thieu.py --chi-tiet")
        print("Xuất ra CSV để điền:                 python3 scripts/bao-cao-thieu.py --csv")


if __name__ == "__main__":
    main()
