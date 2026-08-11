import { useState } from "react";

import { Bar, Empty, openLink } from "../components/ui";
import glossaryFile from "../data/glossary.json";
import type { Store } from "../state/useStore";
import type { VocabEntry } from "../lib/types";

/**
 * Sổ từ chuyên ngành đi kèm app — tài liệu tham khảo chung, ai cài cũng có.
 * Người dùng nhập file Excel riêng thì bản của họ thay thế bản này.
 */
const GLOSSARY = (glossaryFile as { terms: VocabEntry[] }).terms;

export default function Quizlet({ store }: { store: Store }) {
  const data = store.data!;
  const vocabSource = data.vocab.length > 0 ? data.vocab : GLOSSARY;
  const usingBundled = data.vocab.length === 0;
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ subject: "", name: "", url: "", total: 0 });
  const [search, setSearch] = useState("");

  const totalWords = data.decks.reduce((sum, deck) => sum + deck.total, 0);
  const remainingWords = data.decks.reduce((sum, deck) => sum + deck.remaining, 0);
  const learned = totalWords - remainingWords;

  const vocab = vocabSource.filter((entry) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return `${entry.term} ${entry.reading} ${entry.meaning} ${entry.hint}`
      .toLowerCase()
      .includes(needle);
  });

  const submit = () => {
    if (!draft.name.trim() || !draft.url.trim()) return;
    store.addDeck({
      subject: draft.subject.trim() || "Khác",
      name: draft.name.trim(),
      url: draft.url.trim(),
      total: draft.total,
      remaining: draft.total,
    });
    setDraft({ subject: "", name: "", url: "", total: 0 });
    setAdding(false);
  };

  return (
    <div className="container">
      <div className="grid cols-3">
        <div className="stat">
          <div className="stat-label">🗂️ Bộ thẻ</div>
          <div className="stat-value blue">{data.decks.length}</div>
          <div className="stat-foot">bộ Quizlet đang theo dõi</div>
        </div>
        <div className="stat">
          <div className="stat-label">✅ Đã thuộc</div>
          <div className="stat-value green">{learned}</div>
          <div className="stat-foot">
            trên {totalWords} từ ·{" "}
            {totalWords > 0 ? Math.round((learned / totalWords) * 100) : 0}%
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">🔁 Còn quên</div>
          <div className="stat-value amber">{remainingWords}</div>
          <div className="stat-foot">từ cần ôn lại</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">
            Bộ thẻ Quizlet
            <div className="card-sub">
              Sửa số từ còn quên sau mỗi lần học để theo dõi tiến bộ
            </div>
          </div>
          <button className="btn primary sm" onClick={() => setAdding((on) => !on)}>
            {adding ? "Huỷ" : "+ Thêm bộ"}
          </button>
        </div>

        {adding && (
          <div
            className="card tight"
            style={{ background: "var(--surface-2)", marginBottom: 14 }}
          >
            <div className="grid cols-2" style={{ gap: 10 }}>
              <div className="field">
                <span className="field-label">Môn</span>
                <input
                  className="input"
                  placeholder="Kikai / Denryoku / Riron / Houki"
                  value={draft.subject}
                  onChange={(event) =>
                    setDraft({ ...draft, subject: event.target.value })
                  }
                />
              </div>
              <div className="field">
                <span className="field-label">Tên bộ thẻ</span>
                <input
                  className="input"
                  placeholder="Ví dụ: Chương 9 - Điều khiển tự động"
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                />
              </div>
              <div className="field">
                <span className="field-label">Link Quizlet</span>
                <input
                  className="input"
                  placeholder="https://quizlet.com/..."
                  value={draft.url}
                  onChange={(event) => setDraft({ ...draft, url: event.target.value })}
                />
              </div>
              <div className="field">
                <span className="field-label">Tổng số từ</span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={draft.total || ""}
                  onChange={(event) =>
                    setDraft({ ...draft, total: Number(event.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <button
              className="btn primary sm"
              style={{ marginTop: 12 }}
              onClick={submit}
              disabled={!draft.name.trim() || !draft.url.trim()}
            >
              Thêm bộ thẻ
            </button>
          </div>
        )}

        {data.decks.length === 0 ? (
          <Empty icon="🗂️" title="Chưa có bộ thẻ nào">
            <p className="muted">
              Bộ thẻ Quizlet là của riêng từng người. Bấm “Thêm bộ” để gắn link
              bộ thẻ của bạn vào đây, rồi cập nhật số từ còn quên sau mỗi lần học.
            </p>
          </Empty>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {data.decks.map((deck) => {
              const known = deck.total - deck.remaining;
              const ratio = deck.total > 0 ? known / deck.total : 0;
              return (
                <div key={deck.id}>
                  <div className="row between wrap" style={{ gap: 8, marginBottom: 6 }}>
                    <div className="row" style={{ gap: 8, minWidth: 0 }}>
                      <span className="pill todo">{deck.subject}</span>
                      <span
                        className="link"
                        style={{ fontWeight: 600 }}
                        onClick={() => openLink(deck.url)}
                      >
                        {deck.name} ↗
                      </span>
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                      <span className="small muted nowrap">
                        còn quên{" "}
                        <input
                          className="input"
                          type="number"
                          min={0}
                          max={deck.total}
                          value={deck.remaining}
                          onChange={(event) =>
                            store.updateDeck(deck.id, {
                              remaining: Math.max(
                                0,
                                Math.min(deck.total, Number(event.target.value) || 0),
                              ),
                            })
                          }
                          style={{
                            width: 74,
                            display: "inline-block",
                            padding: "3px 8px",
                            textAlign: "center",
                          }}
                        />{" "}
                        / {deck.total}
                      </span>
                      <button
                        className="icon-btn"
                        title="Xoá bộ thẻ này"
                        onClick={() => store.removeDeck(deck.id)}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                  <Bar
                    ratio={ratio}
                    color={ratio >= 1 ? "var(--green)" : "var(--blue)"}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">
            Sổ từ vựng chuyên ngành
            <div className="card-sub">
              {vocabSource.length} từ
              {usingBundled ? " — sổ đi kèm app" : " — lấy từ file Excel của bạn"}
            </div>
          </div>
          <div className="search-wrap" style={{ maxWidth: 260 }}>
            <span className="search-icon">🔍</span>
            <input
              className="input"
              placeholder="Tìm từ, nghĩa…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {vocab.length === 0 ? (
          <Empty icon="🔍" title="Không tìm thấy từ nào" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {vocab.map((entry) => (
              <div
                key={entry.id}
                className="row"
                style={{
                  gap: 14,
                  padding: "10px 2px",
                  borderBottom: "1px solid var(--divider)",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ minWidth: 150 }}>
                  <div className="ja" style={{ fontSize: 17, fontWeight: 700 }}>
                    {entry.term}
                  </div>
                  <div className="ja small dim">{entry.reading}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div>{entry.meaning}</div>
                  {entry.hint && (
                    <div className="small dim" style={{ marginTop: 2 }}>
                      {entry.hint}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
