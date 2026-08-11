/**
 * Khối chi tiết một bài: mở link bài, ghi chú, link tham khảo riêng.
 *
 * Ghi chú và link tham khảo gõ vào ô cục bộ trước, chỉ đẩy lên store khi rời ô
 * hoặc sau một nhịp dừng gõ. Nếu đẩy lên sau mỗi phím thì cả cây React sẽ vẽ
 * lại 1608 dòng mỗi lần bấm phím.
 */

import { useEffect, useRef, useState } from "react";

import { levelLabel, overdueDays, todayISO } from "../lib/srs";
import type { CatalogItem, ItemProgress } from "../lib/types";
import { ExternalLink, Stars, StatusPill, openLink } from "./ui";

const TYPING_PAUSE_MS = 400;

/** Ô nhập tự đồng bộ: gõ mượt ở cục bộ, đẩy lên store khi ngừng gõ. */
function useDeferredField(value: string, commit: (next: string) => void) {
  const [draft, setDraft] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(value);

  // Dữ liệu đổi từ nơi khác (đổi bài, khôi phục sao lưu) thì nạp lại ô.
  useEffect(() => {
    if (value !== latest.current) {
      latest.current = value;
      setDraft(value);
    }
  }, [value]);

  const onChange = (next: string) => {
    setDraft(next);
    latest.current = next;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(next), TYPING_PAUSE_MS);
  };

  const onBlur = () => {
    if (timer.current) clearTimeout(timer.current);
    if (draft !== value) commit(draft);
  };

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { draft, onChange, onBlur };
}

export default function ItemDetail({
  item,
  progress,
  onNote,
  onRefLink,
  compact,
}: {
  item: CatalogItem;
  progress: ItemProgress | undefined;
  onNote(text: string): void;
  onRefLink(url: string): void;
  compact?: boolean;
}) {
  const note = useDeferredField(progress?.note ?? "", onNote);
  const ref = useDeferredField(progress?.refLink ?? "", onRefLink);
  const late = overdueDays(progress, todayISO());

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {!compact && (
        <div className="row wrap" style={{ gap: 8 }}>
          <StatusPill status={progress?.status ?? "todo"} />
          <Stars count={item.stars} />
          <span className="small dim">{levelLabel(progress?.srsLevel ?? 0)}</span>
          {progress?.nextReview && (
            <span className={`pill ${late > 0 ? "overdue" : "due"}`}>
              {late > 0 ? `Quá hạn ${late} ngày` : `Ôn lại ${progress.nextReview}`}
            </span>
          )}
          {progress?.doneDate && (
            <span className="small dim">Làm gần nhất {progress.doneDate}</span>
          )}
        </div>
      )}

      <div className="btn-row">
        <button className="btn primary" onClick={() => openLink(item.url)}>
          ↗ Mở bài trên denken-ou.com
        </button>
        {ref.draft.trim().startsWith("http") && (
          <button className="btn" onClick={() => openLink(ref.draft.trim())}>
            🔖 Mở link tham khảo
          </button>
        )}
      </div>

      <div className="field">
        <label className="field-label" htmlFor={`note-${item.id}`}>
          📝 Ghi chú
        </label>
        <textarea
          id={`note-${item.id}`}
          className="textarea"
          placeholder="Cách giải, chỗ hay nhầm, công thức cần nhớ…"
          value={note.draft}
          onChange={(event) => note.onChange(event.target.value)}
          onBlur={note.onBlur}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor={`ref-${item.id}`}>
          🔗 Link tham khảo của bạn
        </label>
        <input
          id={`ref-${item.id}`}
          className="input"
          placeholder="Dán link Gemini, YouTube, ghi chú… (link riêng của bạn)"
          value={ref.draft}
          onChange={(event) => ref.onChange(event.target.value)}
          onBlur={ref.onBlur}
        />
        <div className="field-hint">
          Link bài tập đi kèm app, còn link tham khảo là của riêng bạn — cập nhật
          app không làm mất phần này.
        </div>
      </div>

      {!compact && (
        <div className="small dim">
          Link bài:{" "}
          <ExternalLink url={item.url}>
            <span className="mono">{item.url}</span>
          </ExternalLink>
        </div>
      )}
    </div>
  );
}
