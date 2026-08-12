#!/usr/bin/env python3
"""Đọc bảng đáp án chính thức (PDF của 電気技術者試験センター) vào answers.json.

    python3 scripts/dap-an-pdf.py duong/dan/*.pdf
    python3 scripts/dap-an-pdf.py --thu duong/dan/*.pdf   # chỉ xem, không ghi

Mỗi file là một trang, bốn cột 理論 / 電力 / 機械 / 法規 xếp cạnh nhau. Không đọc
theo thứ tự chữ trong file — thứ tự đó chạy ngang qua cả bốn cột nên rất dễ ghép
nhầm đáp án của môn này sang môn kia. Ở đây gom theo **toạ độ**: cột nào ra cột
đó, rồi ghép nhãn (問１５(a)) với con số nằm cùng dòng.

Ghi chú:
  * Câu bị đánh dấu ※ (đề có sai sót, mọi đáp án đều được chấp nhận) không được
    đưa vào bảng đáp án — app sẽ coi như câu chưa có đáp án và không tính vào
    điểm, tức là không ai bị trừ điểm vì câu đó.
  * Câu nào không tìm thấy trong danh mục thì báo ra, không tự bịa id.
"""

from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

try:
    import pymupdf
except ImportError:  # pragma: no cover
    sys.exit("Cần cài thư viện đọc PDF trước:  pip install pymupdf")

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "src" / "data" / "catalog.json"
ANSWERS = ROOT / "src" / "data" / "answers.json"

# Thứ tự cột trên tờ đáp án, trái sang phải.
COLUMN_SUBJECTS = ["riron", "denryoku", "kikai", "houki"]

SUBJECT_HEADERS = {
    "理論": "riron",
    "電力": "denryoku",
    "機械": "kikai",
    "法規": "houki",
}

# 令和 và 平成 đánh số kỳ thi mỗi thời một khác, mà danh mục lại giữ đúng tên mà
# denken-ou.com dùng, nên phải tra bảng chứ không suy ra được bằng công thức.
ERA_TO_EXAM = {
    ("令和", 1, ""): "R01",
    ("令和", 2, ""): "R2",
    ("令和", 3, ""): "R3",
    ("令和", 4, "上"): "R4上",
    ("令和", 4, "下"): "R4下",
    ("令和", 5, "上"): "R05上",
    ("令和", 5, "下"): "R05下",
    ("令和", 6, "上"): "R06上",
    ("令和", 6, "下"): "R06下",
    ("令和", 7, "上"): "R07上",
    ("令和", 7, "下"): "R07下",
}


def to_ascii_digits(text: str) -> str:
    """１２３ -> 123, giữ nguyên phần còn lại."""
    return "".join(
        str(unicodedata.decimal(ch)) if ch.isdigit() else ch for ch in text
    )


def exam_label(title: str) -> str | None:
    """'令和４年度 下期 …' -> 'R4下'."""
    plain = to_ascii_digits(title)

    heisei = re.search(r"平成(\d+)年度", plain)
    if heisei:
        return f"H{int(heisei.group(1))}"

    reiwa = re.search(r"令和(元|\d+)年度", plain)
    if reiwa:
        year = 1 if reiwa.group(1) == "元" else int(reiwa.group(1))
        half = "上" if "上期" in plain else "下" if "下期" in plain else ""
        return ERA_TO_EXAM.get(("令和", year, half))
    return None


def parse_pdf(path: Path) -> tuple[str, dict[str, dict[int, list]]]:
    """Trả về (tên kỳ thi, {môn: {số câu: [đáp án từng ý]}})."""
    page = pymupdf.open(path)[0]
    words = page.get_text("words")  # (x0, y0, x1, y1, chữ, …)

    # Tiêu đề lấy theo dòng chứ không theo từng chữ: vài năm tiêu đề bị tách làm
    # đôi ở khoảng trắng nên không có chữ nào chứa đủ cả năm lẫn "第三種".
    title = next(
        (line for line in page.get_text().splitlines() if "年度" in line),
        "",
    )
    exam = exam_label(title)
    if not exam:
        raise SystemExit(f"{path.name}: không đọc được tên kỳ thi từ '{title}'")

    # Ranh giới bốn cột suy ra từ chính các ô nhãn "問N" của tờ này, không cắm
    # cứng toạ độ: bố cục đổi theo từng thời kỳ (令和7年度 có thêm cột 配点, lề
    # cũng khác), cắm số cũ vào là gom nhầm cột.
    # Chỉ nhận ô nhãn đúng nghĩa. Dùng `match` lỏng sẽ vớ luôn dòng chú thích
    # cuối trang ("※機械科目 問8については…") và đẻ ra một cột thứ năm.
    label_re = re.compile(r"問[\d０-９]+(\((a|b)\)|（(a|b)）)?$")
    label_words = [w for w in words if label_re.fullmatch(w[4].strip())]
    if len(label_words) < 8:
        raise SystemExit(f"{path.name}: không thấy bảng đáp án nào trong file")

    edges: list[float] = []
    for x in sorted(w[0] for w in label_words):
        if not edges or x - edges[-1] > 40:  # sang cột mới
            edges.append(x)
    if len(edges) != 4:
        raise SystemExit(f"{path.name}: đọc ra {len(edges)} cột, đáng ra 4")
    # Lùi mép trái một chút vì dòng (b) thụt vào so với dòng 問N.
    bounds = [x - 14 for x in edges]

    def column_of(x: float) -> int:
        index = 0
        for i, edge in enumerate(bounds):
            if x >= edge:
                index = i
        return index

    # Thứ tự cột luôn là 理論 / 電力 / 機械 / 法規; đọc được dòng tiêu đề thì đối
    # chiếu lại cho chắc. NFKC để 電⼒ (bộ thủ Khang Hy) hoá thành 電力.
    subjects = list(COLUMN_SUBJECTS)
    seen: list[tuple[float, str]] = []
    for word in words:
        plain = unicodedata.normalize("NFKC", re.sub(r"[＜＞<>\s　]", "", word[4]))
        if plain in SUBJECT_HEADERS:
            seen.append((word[0], SUBJECT_HEADERS[plain]))
    seen.sort()
    if len(seen) == 4:
        subjects = [key for _, key in seen]

    # Tờ đáp án từ 令和7年度 có thêm cột 配点 (điểm) bên cạnh cột 解答 (đáp án).
    # Lấy ô cuối dòng là vơ nhầm điểm thành đáp án, nên bám theo vị trí chữ 解答.
    answer_x: list[float | None] = [None] * 4
    header_bottom = 0.0
    for word in words:
        if word[4].strip() == "解答":
            answer_x[column_of(word[0])] = word[0]
            header_bottom = max(header_bottom, word[3])

    top = min(w[1] for w in label_words) - 2

    # Gom chữ thành từng cột.
    columns: list[list[tuple[float, float, str]]] = [[] for _ in range(4)]
    for word in words:
        x0, y0, _, _, text = word[:5]
        text = text.strip()
        if not text or "年度" in text or "＜" in text or "注" in text:
            continue
        if text in {"問", "解答", "配点"}:  # dòng tiêu đề của bảng
            continue
        if y0 < max(top, header_bottom):
            continue
        columns[column_of(x0)].append((y0, x0, text))

    def group_rows(entries: list[tuple[float, float, str]]) -> list[list[tuple[float, str]]]:
        """Gom thành từng dòng theo y, cho phép lệch vài chấm.

        Có tờ đặt nhãn và con số lệch nhau chưa tới một chấm (R07上 法規 問12) —
        gom bằng cách làm tròn y là tách đôi mất một dòng.
        """
        rows: list[list[tuple[float, str]]] = []
        anchor = None
        for y, x, text in sorted(entries):
            if anchor is None or y - anchor > 4:
                rows.append([])
                anchor = y
            rows[-1].append((x, text))
        return rows

    out: dict[str, dict[int, list]] = {key: {} for key in subjects}
    for index, entries in enumerate(columns):
        subject = subjects[index]
        current: int | None = None

        for row in group_rows(entries):
            cells = sorted(row)
            if len(cells) < 2:
                continue
            label = to_ascii_digits(cells[0][1])

            target = answer_x[index]
            value_cell = (
                min(cells[1:], key=lambda cell: abs(cell[0] - target))
                if target is not None
                else cells[-1]
            )
            value_text = to_ascii_digits(value_cell[1]).strip()

            number = re.search(r"問(\d+)", label)
            sub = 0 if "(a)" in label else 1 if "(b)" in label else None

            # Số hiệu ghi ở dòng (b) KHÔNG tin được: nhiều tờ đáp án có lớp chữ
            # hỏng, mọi dòng (b) đều đọc ra "問１６(b)" dù mắt thường thấy đúng.
            # Dòng (b) luôn là ý thứ hai của câu (a) ngay trên nó, nên bám theo
            # câu đang xét thay vì tin con số.
            if number and sub != 1:
                current = int(number.group(1))
            if current is None:
                continue

            # ※ = đề sai sót, mọi đáp án đều đúng; không đưa vào bảng đáp án.
            answer = int(value_text) if value_text.isdigit() else None

            slot = out[subject].setdefault(current, [])
            position = sub if sub is not None else 0
            while len(slot) <= position:
                slot.append(None)
            slot[position] = answer

    return exam, out


# Hình dạng chuẩn của một tờ đáp án: môn -> (số câu A, số câu B).
# A問題 một ý, B問題 hai ý — lệch khỏi đây là đọc sai, phải kêu lên chứ đừng
# lặng lẽ ghi vào bảng đáp án.
EXPECTED = {
    "riron": (14, [15, 16, 17, 18]),
    "denryoku": (14, [15, 16, 17]),
    "kikai": (14, [15, 16, 17, 18]),
    "houki": (10, [11, 12, 13]),
}


def check_shape(exam: str, papers: dict[str, dict[int, list]]) -> list[str]:
    """Soi lại kết quả đọc: thiếu câu, thừa câu, hay sai số ý."""
    problems: list[str] = []

    for subject, (a_count, b_numbers) in EXPECTED.items():
        questions = papers.get(subject, {})
        want = set(range(1, a_count + 1)) | set(b_numbers)
        got = set(questions)

        for number in sorted(want - got):
            problems.append(f"{exam} {subject}: thiếu 問{number}")
        for number in sorted(got - want):
            problems.append(f"{exam} {subject}: thừa 問{number} (đọc nhầm?)")

        for number, values in sorted(questions.items()):
            need = 2 if number in b_numbers else 1
            if len(values) != need:
                problems.append(
                    f"{exam} {subject} 問{number}: đọc ra {len(values)} ý, đáng ra {need}"
                )
            for value in values:
                if value is not None and not 1 <= value <= 5:
                    problems.append(f"{exam} {subject} 問{number}: đáp án lạ {value}")
    return problems


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry_run = "--thu" in sys.argv
    if not args:
        sys.exit(__doc__)

    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    # (kỳ thi, môn, số câu) -> tất cả id khớp. Danh mục có vài bài trùng dòng nên
    # gán cho cả nhóm, khỏi phụ thuộc vào việc app giữ lại dòng nào.
    index: dict[tuple[str, str, int], list[str]] = {}
    for item in catalog["items"]:
        match = re.search(r"(\d+)", item["question"])
        if not match:
            continue
        key = (item["exam"], item["subject"], int(match.group(1)))
        index.setdefault(key, []).append(item["id"])

    existing = json.loads(ANSWERS.read_text(encoding="utf-8")) if ANSWERS.exists() else {}
    answers: dict[str, list[int]] = dict(existing.get("answers", {}))

    added = skipped_star = 0
    missing: list[str] = []
    conflicts: list[str] = []

    broken: list[str] = []

    for path in sorted(Path(p) for p in args):
        exam, papers = parse_pdf(path)
        broken += check_shape(exam, papers)
        found = gaps = 0

        for subject, questions in papers.items():
            for number, values in sorted(questions.items()):
                if any(v is None for v in values):
                    skipped_star += 1
                    missing.append(f"{exam} {subject} 問{number} (đề có ※, bỏ qua)")
                    continue

                ids = index.get((exam, subject, number))
                if not ids:
                    gaps += 1
                    missing.append(f"{exam} {subject} 問{number} (danh mục chưa có bài)")
                    continue

                for item_id in ids:
                    old = answers.get(item_id)
                    if old is not None and old != values:
                        conflicts.append(f"{item_id}: {old} -> {values}")
                    answers[item_id] = values
                    added += 1
                found += 1

        total = sum(len(v) for v in papers.values())
        print(f"{path.name[:28]:30} {exam:6} {found:3}/{total} câu khớp danh mục"
              + (f"  · thiếu {gaps}" if gaps else ""))

    if broken:
        print(f"\n⚠ {len(broken)} chỗ tờ đáp án đọc ra không đúng hình dạng chuẩn:")
        for line in broken:
            print("   " + line)
        print("Không ghi gì cả — sửa cách đọc trước đã.")
        sys.exit(1)

    print(f"\nGhi {added} bài vào bảng đáp án ({len(answers)} bài tất cả).")
    if skipped_star:
        print(f"Bỏ qua {skipped_star} câu bị đánh dấu ※ (đề sai sót, mọi đáp án đều đúng).")
    if conflicts:
        print(f"\n{len(conflicts)} chỗ đè lên đáp án cũ:")
        for line in conflicts[:20]:
            print("   " + line)
    if missing:
        print(f"\n{len(missing)} câu chưa vào được bảng đáp án:")
        for line in missing:
            print("   " + line)

    if dry_run:
        print("\n(--thu: không ghi file)")
        return

    ANSWERS.write_text(
        json.dumps(
            {
                "generatedAt": existing.get("generatedAt", ""),
                "source": "Bảng đáp án chính thức của 電気技術者試験センター",
                "answers": dict(sorted(answers.items())),
            },
            ensure_ascii=False,
            indent=1,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"\nĐã ghi {ANSWERS.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
