/**
 * Chọn đáp án ngay trong lúc ôn — thay vì tự khai "tôi làm đúng".
 *
 * Vì sao đổi
 * ----------
 * Trước đây màn Ôn tập chỉ có hai nút **Làm đúng** / **Làm sai**: bạn tự chấm
 * mình. Nhưng app đã có đủ đáp án cho cả 2000 ý, nên bắt người dùng tự khai là
 * bỏ không dùng thứ mình đang có — và tự khai thì dễ rộng tay với chính mình,
 * nhất là với câu mình "thấy quen quen".
 *
 * Nay bấm số như trong phòng thi. Chọn xong là lộ đáp án luôn: ô đã chọn mà sai
 * thì đỏ, ô đúng thì xanh — kể cả khi bạn không chọn nó. Thấy ngay mình lệch
 * sang đáp án nào, thứ mà một chữ "sai" không nói được.
 *
 * Chấm xong mới khoá
 * ------------------
 * Chọn đủ số ý là app tự chấm rồi **khoá** các ô lại. Khoá vì `store.review()`
 * cộng vào sổ ôn mỗi lần gọi: để bấm lại tự do thì một lần bấm nhầm rồi sửa
 * thành ba lượt ôn trong sổ, và chuỗi ngày liên tiếp lẫn mọi biểu đồ lệch theo.
 *
 * Câu B問題 hai ý thì **cả hai ý phải đúng** mới tính là đúng — giống hệt cách
 * kỳ thi thật chấm, nên số liệu ôn tập so được với điểm thi thử.
 *
 * Bài nào chưa có đáp án thì thành phần này trả về `null`, và chỗ gọi lùi về hai
 * nút tự khai như cũ. Thà cho tự khai còn hơn chặn không cho ôn.
 */

import { useEffect, useRef, useState } from "react";

import answersFile from "../data/answers.json";
import { t, t2 } from "../lib/chu";
import type { AnswerKey } from "../lib/exam";
import { SUB_LABELS, subAnswerCount } from "../lib/exam";
import type { CatalogItem } from "../lib/types";

const ANSWERS = (answersFile as { answers: AnswerKey }).answers;

/**
 * Chấm một bài: đúng hay sai.
 *
 * Tách thành hàm thuần để kiểm thử được ca quan trọng nhất — bài hai ý mà
 * **đúng một, sai một**. Nếu viết cẩu thả (ví dụ `some` thay vì `every`, hay chỉ
 * xét ý đầu) thì ca đó báo "đúng", và người học được cộng một lượt đúng cho bài
 * mình chỉ làm được nửa. Ca ấy khó gặp khi bấm tay thử, nên phải ràng bằng kiểm
 * thử chứ không dựa vào may mắn.
 *
 * Luật: cả mọi ý đều phải khớp. Giống hệt cách kỳ thi thật chấm B問題, nên số
 * liệu ôn tập so được với điểm thi thử.
 *
 * Ý nào chưa chọn thì tính là sai — chưa trả lời không phải là trả lời đúng.
 */
export function chamBai(
  chon: readonly (number | undefined)[],
  dapAn: readonly (number | undefined)[],
  soY: number,
): "correct" | "wrong" {
  for (let i = 0; i < soY; i += 1) {
    if (dapAn[i] === undefined) return "wrong";
    if (chon[i] !== dapAn[i]) return "wrong";
  }
  return "correct";
}

/** Bài này có đủ đáp án cho mọi ý hay chưa. */
export function coDapAn(item: CatalogItem): boolean {
  const dapAn = ANSWERS[item.id];
  if (!dapAn) return false;
  const soY = subAnswerCount(item);
  for (let i = 0; i < soY; i += 1) {
    if (dapAn[i] === undefined) return false;
  }
  return true;
}

export function ChonDapAn({
  item,
  onCham,
  banPhim = false,
}: {
  item: CatalogItem;
  /** Gọi đúng MỘT lần, khi đã chọn đủ số ý. */
  onCham(result: "correct" | "wrong"): void;
  /**
   * Cho bấm số 1–5 trên bàn phím.
   *
   * Chỉ màn Ôn tập bật, vì ở đó đang làm đúng một bài và bàn phím vốn đã là
   * cách dùng chính. Màn Danh sách bài thì không: ở đó người ta đang cuộn danh
   * sách 1675 bài, gõ một con số mà chấm luôn bài đang mở là chuyện bất ngờ.
   */
  banPhim?: boolean;
}) {
  const soY = subAnswerCount(item);
  const dapAn = ANSWERS[item.id];

  const [chon, setChon] = useState<(number | undefined)[]>(() => Array(soY).fill(undefined));
  const [hien, setHien] = useState(false);
  /** Đã chấm rồi thì không chấm lần hai, dù React vẽ lại bao nhiêu lần. */
  const daCham = useRef(false);

  // Đổi bài thì làm lại từ đầu. Chỗ gọi đã đặt `key={item.id}` nên thường
  // React dựng lại hẳn thành phần; hiệu ứng này là lớp chắn thứ hai cho trường
  // hợp ai đó bỏ `key` đi — mất nó thì ô đã chọn của bài trước dính sang bài sau.
  useEffect(() => {
    setChon(Array(subAnswerCount(item)).fill(undefined));
    setHien(false);
    daCham.current = false;
  }, [item.id]);

  const pick = (y: number, value: number) => {
    if (hien) return;
    setChon((truoc) => {
      const sau = [...truoc];
      sau[y] = value;

      if (sau.every((v) => v !== undefined) && !daCham.current) {
        daCham.current = true;
        setHien(true);
        onCham(chamBai(sau, dapAn ?? [], soY));
      }
      return sau;
    });
  };

  /* Bàn phím: 1–5 điền vào ý còn trống đầu tiên. Với B問題 thì lần bấm đầu vào
     ý (a), lần sau vào ý (b) — không phải nhắm chuột vào đâu cả. */
  const nhip = useRef({ chon, hien, pick });
  nhip.current = { chon, hien, pick };
  useEffect(() => {
    if (!banPhim) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const value = Number(event.key);
      if (!Number.isInteger(value) || value < 1 || value > 5) return;

      const { chon: dang, hien: daHien, pick: bam } = nhip.current;
      if (daHien) return;
      const y = dang.findIndex((v) => v === undefined);
      if (y === -1) return;
      event.preventDefault();
      bam(y, value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [banPhim]);

  if (!coDapAn(item) || !dapAn) return null;

  return (
    <div className="cham-bai">
      {Array.from({ length: soY }, (_, y) => (
        <div className="exam-choices" key={y}>
          {soY > 1 && <span className="exam-sub-label">{SUB_LABELS[y]}</span>}
          {[1, 2, 3, 4, 5].map((value) => {
            // Sau khi lộ đáp án: ô đúng xanh, ô đã chọn mà sai thì đỏ.
            // Ô đúng tô xanh KỂ CẢ khi không chọn nó — mục đích là thấy đáp án
            // đúng nằm ở đâu, chứ không phải chỉ biết mình sai.
            let lop = "exam-choice";
            if (hien) {
              if (value === dapAn[y]) lop += " dung";
              else if (value === chon[y]) lop += " sai";
            } else if (chon[y] === value) {
              lop += " on";
            }
            return (
              <button
                key={value}
                className={lop}
                onClick={() => pick(y, value)}
                disabled={hien}
                aria-label={t2("Đáp án {n}", { n: value })}
              >
                {value}
              </button>
            );
          })}
          {hien && (
            <span className={`cham-y ${chon[y] === dapAn[y] ? "dung" : "sai"}`}>
              {chon[y] === dapAn[y] ? t("đúng") : t2("đáp án đúng: {n}", { n: dapAn[y]! })}
            </span>
          )}
        </div>
      ))}

      {!hien && (
        <div className="small dim">
          {soY > 1
            ? t("Chọn đáp án cho cả hai ý — cả hai đúng mới tính là làm đúng.")
            : t("Chọn đáp án. Chọn xong sẽ hiện đáp án đúng.")}
          {banPhim && <> {t("Bấm số 1–5 trên bàn phím cũng được.")}</>}
        </div>
      )}

    </div>
  );
}
