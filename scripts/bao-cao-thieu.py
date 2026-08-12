#!/usr/bin/env python3
"""
Báo cáo những chỗ còn thiếu, để biết phải đi tìm cái gì.

Hai loại thiếu, khác hẳn nhau:

  THIẾU CÂU     kỳ thi đó thiếu hẳn câu hỏi trong danh mục — phải bổ sung link
                bài vào file Excel rồi chạy lại convert-excel.py
  THIẾU ĐÁP ÁN  có câu rồi nhưng chưa biết đáp án — điền vào CSV rồi chạy
                build-answers.py

Đếm theo Ý chứ không theo câu: A問題 một ý, B問題 hai ý (a) và (b), mỗi ý một
đáp án riêng và chấm điểm riêng.

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

# Số hiệu các câu B問題 (hai ý) theo từng môn
B_QUESTIONS = {
    "riron": {15, 16, 17, 18},
    "kikai": {15, 16, 17, 18},
    "denryoku": {15, 16, 17},
    "houki": {11, 12, 13},
}


def sub_count(subject: str, number: int) -> int:
    """B問題 có hai ý (a) và (b), A問題 chỉ một."""
    return 2 if number in B_QUESTIONS.get(subject, set()) else 1


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


# Dấu hiệu tiêu đề chưa sạch: còn sót phần đánh dấu của trang nguồn, hoặc là
# chỗ giữ tạm cho bài mới thêm vào.
DIRTY_TITLE = re.compile(r"[\[\]《》〈〉]|chưa có tiêu đề")


def build_csv_rows(have, missing_q, missing_a) -> list[list]:
    """Một dòng cho mỗi câu cần điền gì đó — đáp án, hoặc tiêu đề và số sao.

    Cột tieu_de/sao/chu_de điền sẵn giá trị đang có trong danh mục, để chỉ phải
    sửa chỗ nào sai chứ không phải gõ lại từ đầu.
    """
    need: dict[str, dict] = {}

    def add(exam, subject, number, item, what):
        key = item["id"] if item else f"{exam}/{subject}/{number}"
        row = need.setdefault(
            key,
            {
                "can": set(),
                "exam": exam,
                "subject": subject,
                "number": number,
                "subs": sub_count(subject, number),
                "item": item,
            },
        )
        row["can"].add(what)

    for exam, subject, number, _ in missing_q:
        add(exam, subject, number, None, "thiếu bài")

    for exam, subject, number, item_id, url, lack, subs in missing_a:
        add(exam, subject, number, have[exam][subject][number], "đáp án")

    # Bài có tiêu đề chưa sạch hoặc chưa có sao thì cũng đưa vào để điền nốt.
    for exam, subjects in have.items():
        for subject, questions in subjects.items():
            for number, item in questions.items():
                if DIRTY_TITLE.search(item["name"] or "") or not item["name"]:
                    add(exam, subject, number, item, "tiêu đề")
                elif item["stars"] == 0:
                    add(exam, subject, number, item, "sao")

    rows = []
    for row in sorted(
        need.values(),
        key=lambda r: (exam_rank(r["exam"]), ORDER.index(r["subject"]), r["number"]),
        reverse=True,
    ):
        item = row["item"] or {}
        rows.append(
            [
                " + ".join(sorted(row["can"])),
                row["exam"],
                JA[row["subject"]],
                f"問{row['number']}",
                row["subs"],
                item.get("url", ""),
                "",
                "",
                item.get("name", ""),
                item.get("stars", "") or "",
                item.get("topic", ""),
                item.get("id", ""),
            ]
        )
    return rows


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

    missing_q: list[tuple] = []   # (kỳ, môn, số câu, số ý)
    missing_a: list[tuple] = []   # (kỳ, môn, số câu, id, url, số ý còn thiếu, tổng ý)

    for exam in exams:
        for subject in ORDER:
            present = have[exam].get(subject, {})
            for number in STANDARD[subject]:
                subs = sub_count(subject, number)
                item = present.get(number)
                if item is None:
                    missing_q.append((exam, subject, number, subs))
                    continue
                got = answers.get(item["id"], [])
                if not isinstance(got, list):
                    got = [got]      # chấp nhận file đáp án kiểu cũ
                lack = subs - len([x for x in got[:subs] if x])
                if lack > 0:
                    missing_a.append(
                        (exam, subject, number, item["id"], item["url"], lack, subs)
                    )

    # Tổng số Ý theo chuẩn, không phải tổng số câu
    total_std = sum(
        sub_count(subject, number)
        for subject in STANDARD
        for number in STANDARD[subject]
    ) * len(exams)
    lost_q = sum(e[3] for e in missing_q)
    lost_a = sum(e[5] for e in missing_a)

    print("=" * 70)
    print(f"BÁO CÁO CÒN THIẾU — {len(exams)} kỳ thi, chuẩn {total_std} ý")
    print("=" * 70)
    print()
    print("Đếm theo Ý: A問題 1 ý, B問題 2 ý — (a) và (b) chấm riêng từng ý.")
    print()
    print(f"Thiếu hẳn câu hỏi : {len(missing_q):>5} câu = {lost_q:>5} ý"
          f"  (bổ sung link vào Excel)")
    print(f"Thiếu đáp án      : {len(missing_a):>5} câu = {lost_a:>5} ý"
          f"  (tra đáp án)")
    print(f"Đã đủ              : {total_std - lost_q - lost_a:>5} ý")
    print()

    # ---- Bảng theo từng kỳ ----
    print("-" * 66)
    print(f"{'Kỳ thi':<9}{'理論':>12}{'電力':>12}{'機械':>12}{'法規':>12}")
    print(f"{'':9}{'(thiếu câu / thiếu đáp án)':>48}")
    print("-" * 66)

    for exam in exams:
        cells = []
        for subject in ORDER:
            q = sum(e[3] for e in missing_q if e[0] == exam and e[1] == subject)
            a = sum(e[5] for e in missing_a if e[0] == exam and e[1] == subject)
            cells.append("  ✓  " if q == 0 and a == 0 else f"{q} / {a}")
        print(f"{exam:<9}" + "".join(f"{c:>12}" for c in cells))

    # ---- Chi tiết câu thiếu hẳn ----
    if missing_q:
        print()
        print("-" * 66)
        print("THIẾU HẲN CÂU HỎI — cần tìm link bài rồi thêm vào file Excel")
        print("-" * 66)
        grouped: dict[tuple[str, str], list[int]] = defaultdict(list)
        for exam, subject, number, _ in missing_q:
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
        for exam, subject, number, item_id, url, lack, subs in missing_a:
            tag = "  (2 ý: a và b)" if subs == 2 else ""
            print(f"  {exam:<8} {JA[subject]} 問{number:<3}{tag:<16} {url}")

    # ---- Xuất CSV để tiện điền ----
    if want_csv:
        target = ROOT / "scripts" / "con-thieu.csv"
        rows = build_csv_rows(have, missing_q, missing_a)

        with target.open("w", encoding="utf-8-sig", newline="") as handle:
            writer = csv.writer(handle)
            writer.writerow(
                ["can", "ky_thi", "mon", "cau", "so_y", "link",
                 "dap_an_1", "dap_an_2", "tieu_de", "sao", "chu_de", "id"]
            )
            writer.writerows(rows)

        need_answer = sum(1 for r in rows if "đáp án" in r[0])
        need_title = sum(1 for r in rows if "tiêu đề" in r[0])
        print()
        print(f"→ Đã xuất {target} ({len(rows)} dòng)")
        print(f"     {need_answer} dòng thiếu đáp án · {need_title} dòng thiếu tiêu đề/sao")
        print("  Cột so_y cho biết câu đó cần mấy đáp án:")
        print("      so_y = 1  ->  chỉ điền dap_an_1")
        print("      so_y = 2  ->  điền cả dap_an_1 (ý a) và dap_an_2 (ý b)")
        print("  tieu_de / sao / chu_de đã điền sẵn giá trị đang có — sửa chỗ nào sai thôi.")
        print("  Điền xong chạy:")
        print("      python3 scripts/nap-con-thieu.py scripts/con-thieu.csv")

    if not detail and missing_a:
        print()
        print("Xem từng câu thiếu đáp án kèm link:  python3 scripts/bao-cao-thieu.py --chi-tiet")
        print("Xuất ra CSV để điền:                 python3 scripts/bao-cao-thieu.py --csv")


if __name__ == "__main__":
    main()
