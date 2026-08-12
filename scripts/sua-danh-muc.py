#!/usr/bin/env python3
"""Vá danh mục: khớp lại kỳ thi / số câu / link cho đủ 24 kỳ.

    python3 scripts/sua-danh-muc.py --thu    # xem trước, không ghi
    python3 scripts/sua-danh-muc.py          # vá src/data/catalog.json

Vì sao cần vá
-------------
`exam` và `question` được tách ra từ **tiêu đề** trong file Excel, đoạn `[H19:問3]`
ở đầu tên bài. Tiêu đề nào bị cụt hoặc dính ký tự lạ là mất luôn hai trường đó,
và bài rơi khỏi mọi kỳ thi thử dù link vẫn còn nguyên. Ngược lại, có khối bị lệch
một ô ở cột link nên vài bài mang link của bài khác.

Link denken-ou.com có cấu trúc chặt: `{môn}{kỳ}-{số câu}`, ví dụ
`denryokur4-2-9` = 電力 令和4年度下期 問9. Nhờ vậy suy ngược ra được, và ngược
lại, biết kỳ thi với số câu thì dựng lại được link.

Ba việc script làm
------------------
1. Tiêu đề cụt   -> lấy kỳ thi và số câu từ link.
2. Link lệch     -> dựng lại link từ kỳ thi và số câu (xem KHỐI_LỆCH bên dưới).
3. Thiếu hẳn bài -> thêm dòng mới với link suy ra từ cấu trúc, để trống tiêu đề
                    và số sao cho người dùng điền sau.

**`id` không bao giờ đổi.** Tiến độ ôn tập của người dùng khoá theo `id`; đổi id
là mất lịch sử bài đó. Nên có sửa link thì id vẫn giữ nguyên như cũ — id chỉ là
khoá, không ai đọc ngược ra nội dung từ nó.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "src" / "data" / "catalog.json"

SUBJECTS = ("riron", "denryoku", "kikai", "houki")
JA = {"riron": "理論", "denryoku": "電力", "kikai": "機械", "houki": "法規"}

# Đề thật có bao nhiêu câu mỗi môn.
STANDARD = {
    "riron": 18,
    "denryoku": 17,
    "kikai": 18,
    "houki": 13,
}

# Tên kỳ thi trong danh mục <-> phần kỳ thi trong link. Viết tay vì danh mục giữ
# đúng cách denken-ou.com đặt tên, mà cách đó không đều: R01 nhưng R2, R3.
EXAM_SLUG = {
    "H18": "h18", "H19": "h19", "H20": "h20", "H21": "h21", "H22": "h22",
    "H23": "h23", "H24": "h24", "H25": "h25", "H26": "h26", "H27": "h27",
    "H28": "h28", "H29": "h29", "H30": "h30",
    "R01": "r1", "R2": "r2", "R3": "r3",
    "R4上": "r4-1", "R4下": "r4-2",
    "R05上": "r5-1", "R05下": "r5-2",
    "R06上": "r6-1", "R06下": "r6-2",
    "R07上": "r7-1", "R07下": "r7-2",
}
SLUG_EXAM = {v: k for k, v in EXAM_SLUG.items()}

SLUG_RE = re.compile(
    r"^https://denken-ou\.com/(riron|denryoku|kikai|houki)"
    r"(h\d+|r\d+(?:-[12])?)-(\d+)/$"
)

# Khối 電力〈新エネルギー発電〉bị lệch một ô ở cột link: cả khối xếp giảm dần
# R07下 → H18 rất đều, riêng ba dòng này mang link của dòng ngay trên. Bằng chứng
# là `denryokuh29-5` không có mặt ở bất kỳ đâu trong danh mục, trong khi 16 câu
# còn lại của 電力 H29 đều đủ. Ở đây tin nhãn kỳ thi, dựng lại link.
KHỐI_LỆCH = {
    "denryoku:no-link-354": ("denryoku", "R2", "問5"),
    "denryoku:denryokur2-5": ("denryoku", "H30", "問5"),
    "denryoku:denryokuh30-5": ("denryoku", "H29", "問5"),
}


def parse_slug(url: str) -> tuple[str, str, str] | None:
    """Link -> (môn, kỳ thi, số câu). None nếu link không theo cấu trúc."""
    match = SLUG_RE.match(url or "")
    if not match:
        return None
    exam = SLUG_EXAM.get(match.group(2))
    if not exam:
        return None
    return match.group(1), exam, f"問{int(match.group(3))}"


def make_url(subject: str, exam: str, question: str) -> str:
    number = int(re.search(r"\d+", question).group())
    return f"https://denken-ou.com/{subject}{EXAM_SLUG[exam]}-{number}/"


def main() -> None:
    dry_run = "--thu" in sys.argv
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    items = catalog["items"]

    changes: list[str] = []

    # --- 1. Khối bị lệch link: tin nhãn, dựng lại link ---
    for item in items:
        want = KHỐI_LỆCH.get(item["id"])
        if not want:
            continue
        subject, exam, question = want
        url = make_url(subject, exam, question)
        if item["url"] != url:
            changes.append(
                f"link lệch  {item['id']:34} {item['url'] or '(trống)'} -> {url}"
            )
            item["url"] = url
        item["subject"], item["exam"], item["question"] = subject, exam, question

    # Bài đã nằm đúng chỗ, tra theo link — dùng để nhận ra dòng chỉ là bản liệt
    # kê chéo (cùng link, cùng tên, xếp thêm vào một chủ đề của môn khác).
    settled = {
        item["url"]
        for item in items
        if parse_slug(item["url"])
        == (item["subject"], item["exam"], item["question"])
    }

    # --- 2. Tiêu đề cụt: lấy kỳ thi / số câu / môn từ link ---
    for item in items:
        if item["id"] in KHỐI_LỆCH:
            continue
        parsed = parse_slug(item["url"])
        if not parsed:
            continue
        subject, exam, question = parsed
        if (item["subject"], item["exam"], item["question"]) == parsed:
            continue
        if item["url"] in settled:
            # Bài này đã có một dòng khác đứng đúng chỗ rồi. Đây là dòng liệt kê
            # chéo do người dùng cố ý xếp sang chủ đề của môn khác — sửa môn cho
            # nó là làm hỏng cách sắp xếp của người ta, mà cũng chẳng lấp chỗ nào.
            continue

        before = f"{item['subject']}/{item['exam'] or '—'}/{item['question'] or '—'}"
        changes.append(
            f"theo link  {item['id']:34} {before:24} -> {subject}/{exam}/{question}"
        )
        item["subject"], item["exam"], item["question"] = subject, exam, question

    # --- 3. Dọn tiêu đề còn dính phần đánh dấu của trang nguồn ---
    #
    # Cùng một nguyên nhân với mục 2: tiêu đề bị cụt nên phần "《理論》〈電磁気〉
    # [H19:問3]" không tách ra được, dính luôn vào tên bài. Cắt tới dấu `]` cuối
    # cùng là ra tên thật. Chỉ cắt khi phần còn lại vẫn có chữ — không thì đó là
    # dòng mất hẳn nội dung, để nguyên cho người dùng tự điền.
    for item in items:
        name = item["name"] or ""
        if "]" not in name:
            continue
        rest = name.rsplit("]", 1)[1].strip()
        if len(rest) < 6:  # cắt xong chẳng còn gì thì đừng cắt
            continue
        changes.append(f"dọn tên   {item['id']:34} {name[:34]} -> {rest[:34]}")
        item["name"] = rest

    # --- 4. Thiếu hẳn bài: thêm dòng mới, link suy từ cấu trúc ---
    have = {
        (item["subject"], item["exam"], item["question"])
        for item in items
        if item["exam"]
    }
    next_no = max(item["no"] for item in items) + 1
    added: list[dict] = []

    for exam in EXAM_SLUG:
        for subject in SUBJECTS:
            for number in range(1, STANDARD[subject] + 1):
                question = f"問{number}"
                if (subject, exam, question) in have:
                    continue
                url = make_url(subject, exam, question)
                added.append(
                    {
                        "id": f"{subject}:{url.rstrip('/').rsplit('/', 1)[-1]}",
                        "subject": subject,
                        # Chưa biết chủ đề: để riêng một nhóm cho dễ tìm mà bổ sung.
                        "topic": "（chưa phân loại）",
                        "no": next_no + len(added),
                        # Tiêu đề và số sao để trống — người dùng mở link rồi điền.
                        "name": "（chưa có tiêu đề）",
                        "stars": 0,
                        "category": "",
                        "exam": exam,
                        "question": question,
                        "url": url,
                    }
                )
                changes.append(f"thêm bài   {exam:6} {JA[subject]} {question:6} {url}")

    items.extend(added)
    items.sort(key=lambda item: item["no"])

    print(f"{len(changes)} thay đổi:")
    for line in changes:
        print("   " + line)
    print(f"\nDanh mục: {len(items)} bài (thêm {len(added)}).")

    # Soi lại: còn kỳ nào thiếu câu nữa không.
    have = {
        (item["subject"], item["exam"], item["question"])
        for item in items
        if item["exam"]
    }
    gaps = [
        (exam, subject, number)
        for exam in EXAM_SLUG
        for subject in SUBJECTS
        for number in range(1, STANDARD[subject] + 1)
        if (subject, exam, f"問{number}") not in have
    ]
    print(f"Còn thiếu câu: {len(gaps)}")
    for exam, subject, number in gaps:
        print(f"   {exam} {JA[subject]} 問{number}")

    if dry_run:
        print("\n(--thu: không ghi file)")
        return

    CATALOG.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
    )
    print(f"\nĐã ghi {CATALOG.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
