/**
 * Khối chi tiết một bài: mở link bài, nhiều ghi chú (kèm file), nhiều link tham khảo.
 *
 * Ghi chú gõ vào ô cục bộ trước, chỉ đẩy lên store khi ngừng gõ hoặc rời ô.
 * Nếu đẩy lên sau mỗi phím thì cả cây React sẽ vẽ lại 1608 dòng mỗi lần bấm phím.
 */

import { useEffect, useRef, useState } from "react";

import { levelLabel, overdueDays, todayISO } from "../lib/srs";
import type { Attachment, CatalogItem, ItemProgress, NoteEntry } from "../lib/types";
import type { Store } from "../state/useStore";
import { Stars, StatusPill, openLink } from "./ui";

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
    if (draft !== latest.current || draft !== value) commit(draft);
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { draft, onChange, onBlur };
}

function prettySize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const KIND_ICON: Record<Attachment["kind"], string> = {
  image: "🖼️",
  pdf: "📕",
  docx: "📘",
  other: "📎",
};

/* ------------------------------------------------------------------ */
/* Một file đính kèm                                                   */
/* ------------------------------------------------------------------ */

/** Ảnh hiện luôn thành ô xem trước; file khác hiện thành chip bấm để mở. */
function AttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: Attachment;
  onRemove(): void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (attachment.kind !== "image") return;
    let alive = true;
    void window.denken.attachDataUrl(attachment.file).then((result) => {
      if (!alive) return;
      if (result.ok && result.dataUrl) setSrc(result.dataUrl);
      else setFailed(true);
    });
    return () => {
      alive = false;
    };
  }, [attachment.file, attachment.kind]);

  if (attachment.kind === "image") {
    return (
      <div className="attach-image" title={`${attachment.name} · ${prettySize(attachment.size)}`}>
        {src ? (
          <img
            src={src}
            alt={attachment.name}
            onClick={() => void window.denken.attachOpen(attachment.file)}
          />
        ) : (
          <div className="attach-image-loading">{failed ? "⚠️ mất file" : "…"}</div>
        )}
        <button className="attach-remove" onClick={onRemove} title="Gỡ file này">
          ✕
        </button>
        <div className="attach-caption">{attachment.name}</div>
      </div>
    );
  }

  return (
    <div className="attach-file">
      <span
        className="attach-file-main"
        role="button"
        tabIndex={0}
        title={`Mở ${attachment.name}`}
        onClick={() => void window.denken.attachOpen(attachment.file)}
        onKeyDown={(event) => {
          if (event.key === "Enter") void window.denken.attachOpen(attachment.file);
        }}
      >
        <span className="attach-file-icon">{KIND_ICON[attachment.kind]}</span>
        <span className="attach-file-text">
          <span className="attach-file-name">{attachment.name}</span>
          <span className="attach-file-size">{prettySize(attachment.size)}</span>
        </span>
      </span>
      <button className="icon-btn" onClick={onRemove} title="Gỡ file này">
        🗑
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Một ghi chú                                                         */
/* ------------------------------------------------------------------ */

function NoteCard({
  note,
  index,
  itemId,
  store,
  autoFocus,
  onError,
}: {
  note: NoteEntry;
  index: number;
  itemId: string;
  store: Store;
  autoFocus: boolean;
  onError(message: string): void;
}) {
  const field = useDeferredField(note.text, (text) =>
    store.setNoteText(itemId, note.id, text),
  );
  const box = useRef<HTMLTextAreaElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (autoFocus) box.current?.focus();
  }, [autoFocus]);

  const pick = async () => {
    setBusy(true);
    const result = await window.denken.attachPick();
    setBusy(false);
    if (result.cancelled) return;
    if (result.attachments?.length) {
      store.addAttachments(itemId, note.id, result.attachments);
    }
    if (result.error) onError(result.error);
  };

  /** Dán ảnh thẳng từ clipboard — chụp màn hình xong Ctrl+V là xong. */
  const onPaste = async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const images = [...event.clipboardData.items].filter((entry) =>
      entry.type.startsWith("image/"),
    );
    if (images.length === 0) return; // dán chữ thì để trình duyệt xử lý như thường
    event.preventDefault();

    setBusy(true);
    for (const entry of images) {
      const file = entry.getAsFile();
      if (!file) continue;
      const ext = (file.type.split("/")[1] ?? "png").replace("jpeg", "jpg");
      const name = file.name || `anh-dan-${Date.now()}.${ext}`;
      const result = await window.denken.attachSave(name, await file.arrayBuffer());
      if (result.ok && result.attachment) {
        store.addAttachments(itemId, note.id, [result.attachment]);
      } else {
        onError(result.error ?? "Không lưu được ảnh dán vào.");
      }
    }
    setBusy(false);
  };

  const images = note.attachments.filter((a) => a.kind === "image");
  const files = note.attachments.filter((a) => a.kind !== "image");

  return (
    <div className="note-card">
      <div className="note-head">
        <span className="small dim">Ghi chú {index + 1}</span>
        <span className="spacer" />
        <button
          className="icon-btn"
          onClick={() => store.removeNote(itemId, note.id)}
          title="Xoá ghi chú này"
        >
          🗑
        </button>
      </div>

      <textarea
        ref={box}
        className="textarea"
        placeholder="Cách giải, chỗ hay nhầm, công thức cần nhớ… (dán ảnh chụp màn hình thẳng vào đây được)"
        value={field.draft}
        onChange={(event) => field.onChange(event.target.value)}
        onBlur={field.onBlur}
        onPaste={onPaste}
      />

      {images.length > 0 && (
        <div className="attach-grid">
          {images.map((attachment) => (
            <AttachmentChip
              key={attachment.id}
              attachment={attachment}
              onRemove={() => store.removeAttachment(itemId, note.id, attachment.id)}
            />
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="attach-list">
          {files.map((attachment) => (
            <AttachmentChip
              key={attachment.id}
              attachment={attachment}
              onRemove={() => store.removeAttachment(itemId, note.id, attachment.id)}
            />
          ))}
        </div>
      )}

      <div className="note-foot">
        <button className="btn sm" onClick={() => void pick()} disabled={busy}>
          📎 {busy ? "Đang thêm…" : "Đính kèm file"}
        </button>
        <span className="field-hint">Ảnh, PDF, Word — hoặc dán ảnh vào ô trên.</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Một link tham khảo                                                  */
/* ------------------------------------------------------------------ */

function LinkRow({
  link,
  itemId,
  store,
}: {
  link: { id: string; url: string; label: string };
  itemId: string;
  store: Store;
}) {
  const url = useDeferredField(link.url, (value) =>
    store.setLink(itemId, link.id, { url: value }),
  );
  const label = useDeferredField(link.label, (value) =>
    store.setLink(itemId, link.id, { label: value }),
  );
  const openable = url.draft.trim().startsWith("http");

  return (
    <div className="link-row">
      <input
        className="input link-label"
        placeholder="Tên gợi nhớ"
        value={label.draft}
        onChange={(event) => label.onChange(event.target.value)}
        onBlur={label.onBlur}
      />
      <input
        className="input link-url"
        placeholder="https://…"
        value={url.draft}
        onChange={(event) => url.onChange(event.target.value)}
        onBlur={url.onBlur}
      />
      {/* Nút mở nằm ngay cạnh chính đường link đó */}
      <button
        className="btn sm"
        disabled={!openable}
        title={openable ? `Mở ${url.draft}` : "Link phải bắt đầu bằng http"}
        onClick={() => openLink(url.draft.trim())}
      >
        ↗ Mở
      </button>
      <button
        className="icon-btn"
        onClick={() => store.removeLink(itemId, link.id)}
        title="Xoá link này"
      >
        🗑
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function ItemDetail({
  item,
  progress,
  store,
  compact,
  onOpenExercise,
}: {
  item: CatalogItem;
  progress: ItemProgress | undefined;
  store: Store;
  compact?: boolean;
  /** Màn Ôn tập truyền vào để mở bài đồng thời khởi động đồng hồ. */
  onOpenExercise?: () => void;
}) {
  const [focusNote, setFocusNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const late = overdueDays(progress, todayISO());

  const notes = progress?.notes ?? [];
  const links = progress?.links ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
        <button
          className="btn primary"
          onClick={() => (onOpenExercise ? onOpenExercise() : openLink(item.url))}
        >
          ↗ Mở bài trên denken-ou.com
        </button>
      </div>

      {/* ---------------- Ghi chú ---------------- */}
      <div>
        <div className="row between" style={{ marginBottom: 8 }}>
          <span className="field-label">
            📝 Ghi chú {notes.length > 0 && <span className="dim">({notes.length})</span>}
          </span>
          <button
            className="btn sm"
            onClick={() => setFocusNote(store.addNote(item.id))}
          >
            + Thêm ghi chú
          </button>
        </div>

        {notes.length === 0 ? (
          <div className="field-hint" style={{ padding: "6px 0" }}>
            Chưa có ghi chú nào. Bấm “Thêm ghi chú” để viết cách giải hoặc chỗ hay nhầm.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {notes.map((note, index) => (
              <NoteCard
                key={note.id}
                note={note}
                index={index}
                itemId={item.id}
                store={store}
                autoFocus={focusNote === note.id}
                onError={setError}
              />
            ))}
          </div>
        )}
      </div>

      {/* ---------------- Link tham khảo ---------------- */}
      <div>
        <div className="row between" style={{ marginBottom: 8 }}>
          <span className="field-label">
            🔗 Link tham khảo của bạn{" "}
            {links.length > 0 && <span className="dim">({links.length})</span>}
          </span>
          <button className="btn sm" onClick={() => store.addLink(item.id)}>
            + Thêm link
          </button>
        </div>

        {links.length === 0 ? (
          <div className="field-hint" style={{ padding: "6px 0" }}>
            Chưa có link nào. Dán link Gemini, YouTube, blog… mà bạn dùng cho bài này.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {links.map((link) => (
              <LinkRow key={link.id} link={link} itemId={item.id} store={store} />
            ))}
          </div>
        )}

        <div className="field-hint" style={{ marginTop: 8 }}>
          Link bài tập đi kèm app, còn ghi chú và link tham khảo là của riêng bạn —
          cập nhật app không làm mất phần này.
        </div>
      </div>

      {error && (
        <div className="callout danger">
          {error}
          <button
            className="btn sm ghost"
            style={{ marginLeft: 10 }}
            onClick={() => setError(null)}
          >
            Đóng
          </button>
        </div>
      )}
    </div>
  );
}
