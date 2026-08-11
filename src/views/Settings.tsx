import { useState } from "react";

import type { Overview } from "../lib/stats";
import type { Store } from "../state/useStore";

export default function Settings({
  store,
  view,
}: {
  store: Store;
  view: Overview;
}) {
  const data = store.data!;
  const info = store.info;
  const [message, setMessage] = useState<{ kind: string; text: string } | null>(null);

  const run = async (
    action: () => Promise<{ ok: boolean; path?: string; error?: string; cancelled?: boolean }>,
    successText: (path?: string) => string,
  ) => {
    // Ghi nốt phần đang chờ trước khi xuất, để file xuất ra là dữ liệu mới nhất.
    await store.flush();
    const result = await action();
    if (result.cancelled) return;
    setMessage(
      result.ok
        ? { kind: "", text: successText(result.path) }
        : { kind: "danger", text: result.error ?? "Thao tác không thành công." },
    );
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-head">
          <div className="card-title">
            Mục tiêu học
            <div className="card-sub">Ảnh hưởng tới KPI ngày, chuỗi ngày và lịch nhiệt</div>
          </div>
        </div>

        <div className="grid cols-2">
          <div className="field">
            <label className="field-label" htmlFor="goal">
              🎯 Mục tiêu mỗi ngày (số bài)
            </label>
            <input
              id="goal"
              className="input"
              type="number"
              min={1}
              max={300}
              value={data.settings.dailyGoal}
              onChange={(event) =>
                store.updateSettings({
                  dailyGoal: Math.max(1, Number(event.target.value) || 1),
                })
              }
            />
            <div className="field-hint">
              Một ngày được tính vào chuỗi khi số bài ôn đạt mức này.
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="exam">
              📆 Ngày thi
            </label>
            <input
              id="exam"
              className="input"
              type="date"
              value={data.settings.examDate}
              onChange={(event) => store.updateSettings({ examDate: event.target.value })}
            />
            <div className="field-hint">
              Còn {view.daysToExam} ngày. Mặc định đang để 2027-03-21 — chỉnh lại cho
              đúng kỳ thi bạn đăng ký nhé.
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">
            Dữ liệu của bạn
            <div className="card-sub">Nơi cất và cách sao lưu</div>
          </div>
        </div>

        <div className="callout" style={{ marginBottom: 14 }}>
          <strong>Cập nhật app không làm mất dữ liệu.</strong> Bản cài đặt và dữ liệu
          nằm ở hai thư mục tách biệt — trình cài đặt chỉ ghi đè phần chương trình,
          không đụng tới thư mục dữ liệu bên dưới.
        </div>

        {info && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="field">
              <span className="field-label">Thư mục dữ liệu</span>
              <div className="mono muted" style={{ wordBreak: "break-all" }}>
                {info.dataFile}
              </div>
            </div>
            <div className="row wrap" style={{ gap: 20 }}>
              <div>
                <div className="small dim">Bản sao lưu tự động</div>
                <div style={{ fontWeight: 700 }}>{info.backupCount} bản</div>
              </div>
              <div>
                <div className="small dim">Phiên bản app</div>
                <div style={{ fontWeight: 700 }}>{info.appVersion}</div>
              </div>
              <div>
                <div className="small dim">Số bài có tiến độ</div>
                <div style={{ fontWeight: 700 }}>
                  {Object.keys(data.progress).length}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="btn-row" style={{ marginTop: 16 }}>
          <button
            className="btn primary"
            onClick={() =>
              run(
                () => window.denken.exportXlsx(),
                (path) => `Đã xuất file Excel: ${path}`,
              )
            }
          >
            📊 Xuất ra Excel
          </button>
          <button
            className="btn"
            onClick={() =>
              run(
                () => window.denken.exportJson(),
                (path) => `Đã xuất bản sao lưu: ${path}`,
              )
            }
          >
            💾 Xuất bản sao lưu (JSON)
          </button>
          <button
            className="btn"
            onClick={() => void window.denken.revealDataFolder()}
          >
            📂 Mở thư mục dữ liệu
          </button>
        </div>

        <div
          className="row wrap"
          style={{
            gap: 10,
            marginTop: 16,
            paddingTop: 14,
            borderTop: "1px solid var(--divider)",
          }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            <div className="small" style={{ fontWeight: 600 }}>
              Chuyển dữ liệu từ file Excel
            </div>
            <div className="field-hint">
              Chỉ dùng một lần, cho ai trước đây theo dõi tiến độ bằng file Excel
              “Bài tập điện hạng 3”. Ghi đè tiến độ hiện có của các bài trùng.
            </div>
          </div>
          <button
            className="btn sm"
            onClick={async () => {
              await store.flush();
              const result = await window.denken.importXlsx();
              if (result.cancelled) return;
              if (result.ok && result.data) {
                store.replaceAll(result.data);
                const report = result.report;
                setMessage({
                  kind: "",
                  text: report
                    ? `Đã nhập ${report.matched} bài: ${report.notes} ghi chú, ` +
                      `${report.refLinks} link tham khảo, ${report.scheduled} bài đang trong chu kỳ ôn.`
                    : "Đã nhập dữ liệu từ Excel.",
                });
              } else {
                setMessage({
                  kind: "danger",
                  text: result.error ?? "Không nhập được.",
                });
              }
            }}
          >
            📥 Nhập từ file Excel
          </button>
        </div>

        <div className="row wrap" style={{ gap: 10, marginTop: 12 }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div className="small" style={{ fontWeight: 600 }}>
              Khôi phục sau sự cố
            </div>
            <div className="field-hint">
              Lấy lại toàn bộ dữ liệu từ một bản sao lưu. Thay thế tiến độ hiện tại.
            </div>
          </div>
          <button
            className="btn danger sm"
            onClick={async () => {
              await store.flush();
              const result = await window.denken.importJson();
              if (result.cancelled) return;
              if (result.ok && result.data) {
                store.replaceAll(result.data);
                setMessage({ kind: "", text: "Đã khôi phục dữ liệu từ bản sao lưu." });
              } else {
                setMessage({
                  kind: "danger",
                  text: result.error ?? "Không khôi phục được.",
                });
              }
            }}
          >
            ⚠️ Khôi phục từ bản sao lưu
          </button>
        </div>

        {message && (
          <div className={`callout ${message.kind}`} style={{ marginTop: 14 }}>
            {message.text}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">
            Sao lưu ra ngoài máy tính
            <div className="card-sub">
              Thứ duy nhất cứu được bạn khi ổ cứng hỏng hoặc mất máy
            </div>
          </div>
        </div>

        <div className="callout warn" style={{ marginBottom: 14 }}>
          <strong>Bản sao lưu hằng ngày nằm cùng ổ đĩa với bản gốc.</strong> Nó chống
          được xoá nhầm và ghi hỏng, nhưng ổ cứng hỏng thì mất cả hai. Chọn một thư
          mục trong Google Drive hoặc OneDrive ở dưới, app sẽ tự chép sang đó sau mỗi
          lần ghi.
        </div>

        <div className="field" style={{ marginBottom: 12 }}>
          <span className="field-label">📁 Thư mục nhân bản</span>
          <div className="row wrap" style={{ gap: 8 }}>
            <input
              className="input"
              style={{ flex: 1, minWidth: 240 }}
              placeholder="Chưa chọn — ví dụ G:\My Drive\Denken"
              value={data.settings.mirrorDir}
              onChange={(event) =>
                store.updateSettings({ mirrorDir: event.target.value })
              }
            />
            <button
              className="btn"
              onClick={async () => {
                const result = await window.denken.pickMirrorDir();
                if (result.ok && result.dir) {
                  store.updateSettings({ mirrorDir: result.dir });
                  await store.flush();
                  const done = await window.denken.mirrorNow();
                  setMessage(
                    done.ok
                      ? { kind: "", text: `Đã nhân bản sang ${result.dir}` }
                      : { kind: "danger", text: done.error ?? "Nhân bản không thành công." },
                  );
                }
              }}
            >
              Chọn thư mục…
            </button>
            {data.settings.mirrorDir && (
              <button
                className="btn ghost"
                onClick={() => store.updateSettings({ mirrorDir: "" })}
              >
                Tắt
              </button>
            )}
          </div>
          <div className="field-hint">
            Chép cả file đính kèm. File đính kèm chỉ chép một lần vì tên không đổi,
            nên mỗi lần ghi chỉ tốn vài trăm KB của data.json.
          </div>
        </div>

        <div className="btn-row">
          <button
            className="btn sm"
            disabled={!data.settings.mirrorDir}
            onClick={async () => {
              await store.flush();
              const result = await window.denken.mirrorNow();
              setMessage(
                result.ok
                  ? {
                      kind: "",
                      text: `Đã nhân bản sang ${result.path} (chép thêm ${result.files ?? 0} file đính kèm).`,
                    }
                  : { kind: "danger", text: result.error ?? "Nhân bản không thành công." },
              );
            }}
          >
            🔄 Nhân bản ngay
          </button>
          <button
            className="btn sm"
            onClick={() =>
              run(
                () => window.denken.exportZip(),
                (path) => `Đã xuất gói đầy đủ: ${path}`,
              )
            }
          >
            🗜️ Xuất toàn bộ (.zip)
          </button>
          <span className="field-hint" style={{ flex: 1, minWidth: 220 }}>
            Gói .zip có cả ảnh đính kèm; file JSON thì không — khôi phục từ JSON sẽ
            mất ảnh.
          </span>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">
            Sao lưu tự động trên máy
            <div className="card-sub">Chạy ngầm mỗi lần mở app</div>
          </div>
        </div>

        <div className="field" style={{ maxWidth: 260 }}>
          <label className="field-label" htmlFor="keep">
            Số bản sao lưu giữ lại
          </label>
          <input
            id="keep"
            className="input"
            type="number"
            min={1}
            max={365}
            value={data.settings.backupsToKeep}
            onChange={(event) =>
              store.updateSettings({
                backupsToKeep: Math.max(1, Number(event.target.value) || 1),
              })
            }
          />
          <div className="field-hint">
            Mỗi ngày mở app giữ lại một bản, quá số này thì bản cũ nhất bị xoá.
          </div>
        </div>

        <ul className="muted small" style={{ marginTop: 14, lineHeight: 1.8 }}>
          <li>
            Ghi theo kiểu nguyên tử: ghi ra file tạm rồi mới đổi tên đè lên, mất điện
            giữa chừng cũng không làm hỏng dữ liệu.
          </li>
          <li>
            Nếu file chính hỏng, app tự lấy bản sao lưu mới nhất còn đọc được và cất
            file hỏng sang thư mục <span className="mono">corrupt</span> để soi lại.
          </li>
          <li>
            Muốn chắc ăn hơn nữa thì thỉnh thoảng bấm “Xuất bản sao lưu” rồi cất lên
            Google Drive.
          </li>
        </ul>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Chu kỳ ôn tập</div>
        </div>
        <p className="muted small">
          Làm đúng thì bài lên một cấp và hẹn ôn lại xa hơn. Làm sai thì về cấp 1, mai
          ôn lại. Đây đúng là chu kỳ trong file Excel gốc của bạn.
        </p>
        <div className="chip-row" style={{ marginTop: 10 }}>
          {[1, 3, 7, 14, 30, 90].map((days, index) => (
            <span key={days} className="chip">
              Cấp {index + 1} · {days} ngày
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
