#!/usr/bin/env python3
"""Nạp file con-thieu.csv đã điền vào app — cả phần thi thử lẫn phần ôn tập.

    python3 scripts/nap-con-thieu.py scripts/con-thieu.csv --thu   # xem trước
    python3 scripts/nap-con-thieu.py scripts/con-thieu.csv         # nạp thật

Một file CSV đi vào hai chỗ, vì đó là hai loại dữ liệu khác nhau:

    dap_an_1 / dap_an_2   -> src/data/answers.json   (chấm điểm khi thi thử)
    tieu_de / sao / chu_de -> src/data/catalog.json  (hiện khi ôn tập, lọc sao)

Dòng nào để trống thì bỏ qua chứ không xoá cái đang có — điền được tới đâu chạy
tới đó, không cần điền hết một lượt.
"""

from __future__ import annotations

import csv
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "src" / "data" / "catalog.json"
ANSWERS = ROOT / "src" / "data" / "answers.json"

JA_TO_KEY = {"理論": "riron", "電力": "denryoku", "機械": "kikai", "法規": "houki"}


def parse_answer(text: str) -> int | None:
    """Nhận '3', '(3)', '③', '３' — trả về 3. Không đọc được thì None."""
    if not text:
        return None
    for ch in text.strip():
        if ch in "①②③④⑤":
            return "①②③④⑤".index(ch) + 1
        if ch.isdigit():
            value = unicodedata.decimal(ch)
            if 1 <= value <= 5:
                return value
    return None


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry_run = "--thu" in sys.argv
    if not args:
        sys.exit(__doc__)

    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    by_id = {item["id"]: item for item in catalog["items"]}
    # Điền thiếu cột id thì vẫn tra được bằng kỳ thi + môn + số câu.
    by_place = {
        (item["exam"], item["subject"], item["question"]): item
        for item in catalog["items"]
        if item["exam"]
    }

    answers_file = json.loads(ANSWERS.read_text(encoding="utf-8"))
    answers: dict[str, list[int]] = dict(answers_file.get("answers", {}))

    stats = {"đáp án": 0, "tiêu đề": 0, "sao": 0, "chủ đề": 0}
    problems: list[str] = []
    seen = 0

    for path in args:
        with open(path, encoding="utf-8-sig", newline="") as handle:
            for line, row in enumerate(csv.DictReader(handle), start=2):
                seen += 1
                item = by_id.get((row.get("id") or "").strip())
                if item is None:
                    subject = JA_TO_KEY.get((row.get("mon") or "").strip())
                    key = (
                        (row.get("ky_thi") or "").strip(),
                        subject,
                        (row.get("cau") or "").strip(),
                    )
                    item = by_place.get(key)
                if item is None:
                    problems.append(f"dòng {line}: không tìm ra bài nào khớp")
                    continue

                # --- đáp án ---
                first = parse_answer(row.get("dap_an_1", ""))
                second = parse_answer(row.get("dap_an_2", ""))
                want_subs = int(row.get("so_y") or 1)
                if first is not None:
                    values = [first] + ([second] if second is not None else [])
                    if len(values) != want_subs:
                        problems.append(
                            f"dòng {line}: {item['exam']} {row.get('mon')} "
                            f"{item['question']} cần {want_subs} ý, mới điền {len(values)}"
                        )
                    else:
                        if answers.get(item["id"]) != values:
                            stats["đáp án"] += 1
                        answers[item["id"]] = values
                elif second is not None:
                    problems.append(f"dòng {line}: có dap_an_2 mà thiếu dap_an_1")

                # --- tiêu đề / sao / chủ đề ---
                title = (row.get("tieu_de") or "").strip()
                if title and title != item["name"]:
                    item["name"] = title
                    stats["tiêu đề"] += 1

                stars = (row.get("sao") or "").strip()
                if stars:
                    match = re.search(r"\d", stars)
                    count = stars.count("★") or (int(match.group()) if match else 0)
                    if 1 <= count <= 5 and count != item["stars"]:
                        item["stars"] = count
                        stats["sao"] += 1
                    elif not 1 <= count <= 5:
                        problems.append(f"dòng {line}: số sao lạ {stars!r}")

                topic = (row.get("chu_de") or "").strip()
                if topic and topic != item["topic"]:
                    item["topic"] = topic
                    stats["chủ đề"] += 1

    print(f"Đọc {seen} dòng.")
    for name, count in stats.items():
        print(f"   cập nhật {name}: {count}")
    if problems:
        print(f"\n{len(problems)} dòng có vấn đề:")
        for line in problems[:40]:
            print("   " + line)

    if dry_run:
        print("\n(--thu: không ghi file)")
        return

    if stats["đáp án"]:
        answers_file["answers"] = dict(sorted(answers.items()))
        ANSWERS.write_text(
            json.dumps(answers_file, ensure_ascii=False, indent=1) + "\n",
            encoding="utf-8",
        )
        print(f"\nĐã ghi {ANSWERS.relative_to(ROOT)} ({len(answers)} bài có đáp án)")

    if stats["tiêu đề"] or stats["sao"] or stats["chủ đề"]:
        CATALOG.write_text(
            json.dumps(catalog, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
        )
        print(f"Đã ghi {CATALOG.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
