#!/usr/bin/env python3
"""
Dựng src/data/answers.json — bảng đáp án cho chức năng thi thử.

Nhận vào một trong hai nguồn:

  CSV    scripts/mau-dap-an.csv đã điền cột `dap_an` (1..5)
  Excel  file Excel có thêm cột "Đáp án" trong các sheet môn học

Chạy:
    python3 scripts/build-answers.py scripts/mau-dap-an.csv
    python3 scripts/build-answers.py scripts/source.xlsx

Đáp án là dữ liệu chung cho mọi người dùng — giống link bài tập — nên nó nằm
trong `src/data/` đi kèm code, không phải trong thư mục dữ liệu cá nhân.
"""

from __future__ import annotations

import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "src" / "data" / "catalog.json"
TARGET = ROOT / "src" / "data" / "answers.json"

# Cột "Đáp án" nếu bạn thêm vào file Excel (đánh số từ 0)
COL_ANSWER = 12


def valid_ids() -> set[str]:
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    return {item["id"] for item in catalog["items"]}


def parse_choice(raw) -> int | None:
    """Chấp nhận '3', '3.0', '(3)', '③' — trả về 1..5, sai thì None."""
    if raw is None:
        return None
    text = str(raw).strip()
    if not text:
        return None

    circled = "①②③④⑤"
    if text in circled:
        return circled.index(text) + 1

    match = re.search(r"[1-5]", text)
    return int(match.group()) if match else None


def from_csv(path: Path, allowed: set[str]) -> tuple[dict[str, int], Counter]:
    answers: dict[str, int] = {}
    problems: Counter = Counter()

    with path.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            item_id = (row.get("id") or "").strip()
            choice = parse_choice(row.get("dap_an"))
            if choice is None:
                continue
            if item_id not in allowed:
                problems["id không có trong danh mục"] += 1
                continue
            answers[item_id] = choice
    return answers, problems


def from_excel(path: Path, allowed: set[str]) -> tuple[dict[str, int], Counter]:
    import openpyxl

    # Sinh id y hệt cách convert-excel.py làm: lấy từ link bài, thêm hậu tố ~2
    # cho những bài liên môn xuất hiện hai lần.
    subjects = [
        ("riron", "Riron (理論)"),
        ("denryoku", "Denryoku (電力)"),
        ("kikai", "Kikai (機械)"),
        ("houki", "Houki (法規)"),
    ]

    workbook = openpyxl.load_workbook(path, data_only=True)
    answers: dict[str, int] = {}
    problems: Counter = Counter()

    for key, sheet_name in subjects:
        if sheet_name not in workbook.sheetnames:
            continue
        seen: Counter = Counter()
        for row in workbook[sheet_name].iter_rows(min_row=3, values_only=True):
            no = str(row[0] or "").strip()
            if not no:
                continue

            url = str(row[3] or "").strip()
            slug = re.sub(r"^https?://[^/]+/?", "", url).strip("/").lower() or f"no-link-{no}"
            base = f"{key}:{slug}"
            seen[base] += 1
            item_id = base if seen[base] == 1 else f"{base}~{seen[base]}"

            choice = parse_choice(row[COL_ANSWER] if len(row) > COL_ANSWER else None)
            if choice is None:
                continue
            if item_id not in allowed:
                problems["id không có trong danh mục"] += 1
                continue
            answers[item_id] = choice

    return answers, problems


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    source = Path(sys.argv[1])
    if not source.exists():
        sys.exit(f"Không tìm thấy file: {source}")

    allowed = valid_ids()
    if source.suffix.lower() in (".xlsx", ".xlsm"):
        answers, problems = from_excel(source, allowed)
    else:
        answers, problems = from_csv(source, allowed)

    TARGET.write_text(
        json.dumps(
            {
                "version": 1,
                "note": (
                    "Bảng đáp án cho chức năng thi thử. Khoá là id bài (giống "
                    "catalog.json), giá trị là số lựa chọn đúng từ 1 đến 5. "
                    "Câu nào chưa có ở đây thì bài thi bỏ qua không chấm, và điểm "
                    "được quy về thang 100 trên phần chấm được. "
                    f"Sinh từ {source.name} bằng scripts/build-answers.py."
                ),
                "answers": dict(sorted(answers.items())),
            },
            ensure_ascii=False,
            indent=1,
        ),
        encoding="utf-8",
    )

    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    with_exam = [i for i in catalog["items"] if i["exam"]]
    per_exam: Counter = Counter()
    for item in with_exam:
        if item["id"] in answers:
            per_exam[item["exam"]] += 1

    print(f"answers.json : {len(answers)} / {len(with_exam)} câu có đáp án")
    if problems:
        print("   bỏ qua:", dict(problems))
    if per_exam:
        print("   kỳ thi đã có đáp án:")
        for exam, count in sorted(per_exam.items(), key=lambda kv: -kv[1])[:10]:
            total = sum(1 for i in with_exam if i["exam"] == exam)
            print(f"      {exam:<8} {count:>3}/{total}")


if __name__ == "__main__":
    main()
