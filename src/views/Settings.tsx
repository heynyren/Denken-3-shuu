import {
  AlertTriangle,
  Archive,
  CalendarDays,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FolderOpen,
  Languages,
  GitMerge,
  Pause,
  Play,
  Plug,
  RefreshCw,
  Save,
  Share2,
  Target,
} from "lucide-react";
import { Ic } from "../components/ui/icon";
import { VietnamFlag } from "../components/About";
import { useState } from "react";

import { emptyAppData } from "../lib/defaults";
import { parseBackup } from "../lib/normalise";
import { checkAccess } from "../lib/github";
import type { Overview } from "../lib/stats";
import { describeMerge, mergeData } from "../lib/sync";
import type { Store } from "../state/useStore";
import type { Sync } from "../state/useSync";
import { platform } from "../platform";

import { NGON_DS, NGON_TEN, t, t2 } from "../lib/chu";
import type { Ngon } from "../lib/chu";
export default function Settings({
  store,
  view,
  sync,
  onAbout,
}: {
  store: Store;
  view: Overview;
  sync: Sync;
  /** Thanh bên bị ẩn trên điện thoại, nên phần giới thiệu vào đây. */
  onAbout(): void;
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
        : { kind: "danger", text: result.error ?? t("Thao tác không thành công.") },
    );
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-head">
          <div className="card-title">
            {t("Mục tiêu học")}
            <div className="card-sub">{t("Ảnh hưởng tới KPI ngày, chuỗi ngày và lịch nhiệt")}</div>
          </div>
        </div>

        <div className="grid cols-2">
          <div className="field">
            <label className="field-label" htmlFor="goal">
              <Ic i={Target} /> {t("Mục tiêu mỗi ngày (số bài)")}
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
              {t("Một ngày được tính vào chuỗi khi số bài ôn đạt mức này.")}
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="exam">
              <Ic i={CalendarDays} /> {t("Ngày thi")}
            </label>
            <input
              id="exam"
              className="input"
              type="date"
              value={data.settings.examDate}
              onChange={(event) => store.updateSettings({ examDate: event.target.value })}
            />
            <div className="field-hint">
              {t2(
                "Còn {n} ngày. Mặc định đang để 2027-03-21 — chỉnh lại cho đúng kỳ thi bạn đăng ký nhé.",
                { n: view.daysToExam },
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">
            {t("Ngôn ngữ giao diện")}
            <div className="card-sub">{t("Chỉ đổi chữ của app — bài vở và ghi chú của bạn giữ nguyên")}</div>
          </div>
        </div>
        <div className="chip-row">
          {NGON_DS.map((ma: Ngon) => (
            <button
              key={ma}
              type="button"
              className={`chip${(data.settings.uiLang ?? "vi") === ma ? " on" : ""}`}
              onClick={() => store.updateSettings({ uiLang: ma })}
            >
              <Ic i={Languages} /> {NGON_TEN[ma]}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">
            {t("Dữ liệu của bạn")}
            <div className="card-sub">{t("Nơi cất và cách sao lưu")}</div>
          </div>
        </div>

        <div className="callout" style={{ marginBottom: 14 }}>
          <strong>{t("Cập nhật app không làm mất dữ liệu.")}</strong> {t("Bản cài đặt và dữ liệu nằm ở hai thư mục tách biệt — trình cài đặt chỉ ghi đè phần chương trình, không đụng tới thư mục dữ liệu bên dưới.")}
        </div>

        {info && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="field">
              <span className="field-label">{t("Thư mục dữ liệu")}</span>
              <div className="mono muted" style={{ wordBreak: "break-all" }}>
                {info.dataFile}
              </div>
            </div>
            <div className="row wrap" style={{ gap: 20 }}>
              <div>
                <div className="small dim">{t("Bản sao lưu tự động")}</div>
                <div style={{ fontWeight: 700 }}>{t2("{n} bản", { n: info.backupCount })}</div>
              </div>
              <div>
                <div className="small dim">{t("Phiên bản app")}</div>
                <div style={{ fontWeight: 700 }}>{info.appVersion}</div>
              </div>
              <div>
                <div className="small dim">{t("Số bài có tiến độ")}</div>
                <div style={{ fontWeight: 700 }}>
                  {Object.keys(data.progress).length}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="btn-row" style={{ marginTop: 16 }}>
          {platform.can.excelExport && (
            <button
              className="btn primary"
              onClick={() =>
                run(
                  () => platform.exportXlsx(),
                  (path) => t2("Đã xuất file Excel: {duong}", { duong: path ?? "" }),
                )
              }
            >
              <Ic i={FileSpreadsheet} /> {t("Xuất ra Excel")}
            </button>
          )}
          <button
            className="btn"
            onClick={() =>
              run(
                () => platform.exportJson(),
                (path) => t2("Đã xuất bản sao lưu: {duong}", { duong: path ?? "" }),
              )
            }
          >
            <Ic i={Save} /> {t("Xuất bản sao lưu (JSON)")}
          </button>
          {platform.can.revealFolder && (
            <button
              className="btn"
              onClick={() => void platform.revealDataFolder()}
            >
              <Ic i={FolderOpen} /> {t("Mở thư mục dữ liệu")}
            </button>
          )}
        </div>

        {platform.can.excelImport && (
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
              {t("Chuyển dữ liệu từ file Excel")}
            </div>
            <div className="field-hint">
              {t("Chỉ dùng một lần, cho ai trước đây theo dõi tiến độ bằng file Excel “Bài tập điện hạng 3”. Ghi đè tiến độ hiện có của các bài trùng.")}
            </div>
          </div>
          <button
            className="btn sm"
            onClick={async () => {
              await store.flush();
              const result = await platform.importXlsx();
              if (result.cancelled) return;
              if (result.ok && result.data) {
                store.replaceAll(result.data);
                const report = result.report;
                setMessage({
                  kind: "",
                  text: report
                    ? t2(
                        "Đã nhập {bai} bài: {gc} ghi chú, {link} link tham khảo, {lich} bài đang trong chu kỳ ôn.",
                        {
                          bai: report.matched,
                          gc: report.notes,
                          link: report.refLinks,
                          lich: report.scheduled,
                        },
                      )
                    : t("Đã nhập dữ liệu từ Excel."),
                });
              } else {
                setMessage({
                  kind: "danger",
                  text: result.error ?? t("Không nhập được."),
                });
              }
            }}
          >
            <Ic i={Download} /> {t("Nhập từ file Excel")}
          </button>
        </div>
        )}

        <div className="row wrap" style={{ gap: 10, marginTop: 12 }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div className="small" style={{ fontWeight: 600 }}>
              {t("Khôi phục sau sự cố")}
            </div>
            <div className="field-hint">
              {t("Lấy lại toàn bộ dữ liệu từ một bản sao lưu. Thay thế tiến độ hiện tại.")}
            </div>
          </div>
          <button
            className="btn danger sm"
            onClick={async () => {
              await store.flush();
              const result = await platform.importJson();
              if (result.cancelled) return;
              if (result.ok && result.data) {
                store.replaceAll(result.data);
                setMessage({ kind: "", text: t("Đã khôi phục dữ liệu từ bản sao lưu.") });
              } else {
                setMessage({
                  kind: "danger",
                  text: result.error ?? t("Không khôi phục được."),
                });
              }
            }}
          >
            <Ic i={AlertTriangle} /> {t("Khôi phục từ bản sao lưu")}
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
            {t("Sao lưu ra ngoài máy tính")}
            <div className="card-sub">
              {t("Thứ duy nhất cứu được bạn khi ổ cứng hỏng hoặc mất máy")}
            </div>
          </div>
        </div>

        <div className="callout warn" style={{ marginBottom: 14 }}>
          <strong>{t("Bản sao lưu hằng ngày nằm cùng máy với bản gốc.")}</strong>{" "}
          {t("Nó chống được xoá nhầm và ghi hỏng, nhưng mất máy thì mất cả hai.")}{" "}
          {platform.can.mirrorFolder
            ? t("Chọn một thư mục trong Google Drive hoặc OneDrive ở dưới, app sẽ tự chép sang đó sau mỗi lần ghi.")
            : t("Hãy xuất bản sao lưu và cất ra ngoài máy.")}
        </div>

        {platform.can.mirrorFolder && (
        <div className="field" style={{ marginBottom: 12 }}>
          <span className="field-label">
            <Ic i={FolderOpen} /> {t("Thư mục nhân bản")}
          </span>
          <div className="row wrap" style={{ gap: 8 }}>
            <input
              className="input"
              style={{ flex: 1, minWidth: 240 }}
              placeholder={t("Chưa chọn — ví dụ G:\\My Drive\\Denken")}
              value={data.settings.mirrorDir}
              onChange={(event) =>
                store.updateSettings({ mirrorDir: event.target.value })
              }
            />
            <button
              className="btn"
              onClick={async () => {
                const result = await platform.pickMirrorDir();
                if (result.ok && result.dir) {
                  store.updateSettings({ mirrorDir: result.dir });
                  await store.flush();
                  const done = await platform.mirrorNow();
                  setMessage(
                    done.ok
                      ? { kind: "", text: t2("Đã nhân bản sang {duong}", { duong: result.dir ?? "" }) }
                      : { kind: "danger", text: done.error ?? t("Nhân bản không thành công.") },
                  );
                }
              }}
            >
              {t("Chọn thư mục…")}
            </button>
            {data.settings.mirrorDir && (
              <button
                className="btn ghost"
                onClick={() => store.updateSettings({ mirrorDir: "" })}
              >
                {t("Tắt")}
              </button>
            )}
          </div>
          <div className="field-hint">
            {t("Chép cả file đính kèm. File đính kèm chỉ chép một lần vì tên không đổi, nên mỗi lần ghi chỉ tốn vài trăm KB của data.json.")}
          </div>
        </div>
        )}

        <div className="btn-row">
          {platform.can.mirrorFolder && (
          <button
            className="btn sm"
            disabled={!data.settings.mirrorDir}
            onClick={async () => {
              await store.flush();
              const result = await platform.mirrorNow();
              setMessage(
                result.ok
                  ? {
                      kind: "",
                      text: t2("Đã nhân bản sang {duong} (chép thêm {n} file đính kèm).", { duong: result.path ?? "", n: result.files ?? 0 }),
                    }
                  : { kind: "danger", text: result.error ?? t("Nhân bản không thành công.") },
              );
            }}
          >
            <Ic i={RefreshCw} /> {t("Nhân bản ngay")}
          </button>
          )}
          {platform.can.mirrorFolder && (
          <button
            className="btn sm"
            onClick={() =>
              run(
                () => platform.exportZip(),
                (path) => t2("Đã xuất gói đầy đủ: {duong}", { duong: path ?? "" }),
              )
            }
          >
            <Ic i={Archive} /> {t("Xuất toàn bộ (.zip)")}
          </button>
          )}
          <span className="field-hint" style={{ flex: 1, minWidth: 220 }}>
            {t("Gói .zip có cả ảnh đính kèm; file JSON thì không — khôi phục từ JSON sẽ mất ảnh.")}
          </span>
        </div>
      </div>

      {platform.can.cloudSync && <CloudSyncCard sync={sync} />}

      {platform.can.mergeFile && (
        <div className="card">
          <div className="card-head">
            <div className="card-title">
              {t("Đồng bộ máy tính ↔ điện thoại")}
              <div className="card-sub">
                {t("Gộp hai bên bằng một file, không bên nào mất dữ liệu")}
              </div>
            </div>
          </div>

          <div className="callout" style={{ marginBottom: 14 }}>
            <strong>{t("Gộp chứ không ghi đè.")}</strong> {t("Mỗi bài lấy bản")}{" "}
            <em>{t("sửa sau cùng")}</em>
            {t(
              "; số bài đã ôn của từng ngày thì cộng phần mới của hai bên; huy hiệu và lượt thi thử gộp lại hết. Chạy nhầm hai lần cũng không sao — lần thứ hai sẽ báo “hai bên đã giống nhau”.",
            )}
          </div>

          <ol className="step-list">
            <li>
              {t("Máy đang có dữ liệu mới hơn: bấm")} <strong>{t("Xuất file để mang sang")}</strong>.
            </li>
            <li>
              {t("Gửi file đó sang máy kia — Drive, Zalo, Telegram, dây USB, kiểu gì cũng được.")}
            </li>
            <li>
              {t("Ở máy kia bấm")} <strong>{t("Gộp từ file")}</strong> {t("rồi chọn file vừa nhận.")}
            </li>
            <li>{t("Muốn hai bên giống hệt nhau thì làm ngược lại một lượt nữa.")}</li>
          </ol>

          <div className="btn-row" style={{ marginTop: 12 }}>
            <button
              className="btn sm"
              onClick={() =>
                run(
                  () => platform.exportJson(),
                  () => t("Đã xuất file. Gửi sang máy kia rồi bấm Gộp từ file ở đó nhé."),
                )
              }
            >
              <Ic i={Share2} /> {t("Xuất file để mang sang")}
            </button>
            <button
              className="btn sm primary"
              onClick={async () => {
                await store.flush();
                const picked = await platform.pickJsonText();
                if (picked.cancelled) return;
                if (!picked.ok || !picked.text) {
                  setMessage({
                    kind: "danger",
                    text: picked.error ?? t("Không đọc được file."),
                  });
                  return;
                }

                const parsed = parseBackup(picked.text, emptyAppData());
                if ("error" in parsed) {
                  setMessage({ kind: "danger", text: parsed.error });
                  return;
                }

                // Không có mốc gốc để so: coi mọi thay đổi là mới, lấy nhiều hơn
                // thay vì đoán bên nào đã xoá gì.
                const { data: merged, report } = mergeData(null, data, parsed.data);
                store.replaceAll(merged);
                await store.flush();
                setMessage({ kind: "", text: describeMerge(report) });
              }}
            >
              <Ic i={GitMerge} /> {t("Gộp từ file của máy kia")}
            </button>
          </div>

          <div className="field-hint" style={{ marginTop: 8 }}>
            {t("File JSON không mang theo ảnh đính kèm — ảnh ở máy nào vẫn nằm ở máy đó.")}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <div className="card-title">
            {t("Sao lưu tự động trên máy")}
            <div className="card-sub">{t("Chạy ngầm mỗi lần mở app")}</div>
          </div>
        </div>

        <div className="field" style={{ maxWidth: 260 }}>
          <label className="field-label" htmlFor="keep">
            {t("Số bản sao lưu giữ lại")}
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
            {t("Mỗi ngày mở app giữ lại một bản, quá số này thì bản cũ nhất bị xoá.")}
          </div>
        </div>

        <ul className="muted small" style={{ marginTop: 14, lineHeight: 1.8 }}>
          <li>
            {t("Ghi theo kiểu nguyên tử: ghi ra file tạm rồi mới đổi tên đè lên, mất điện giữa chừng cũng không làm hỏng dữ liệu.")}
          </li>
          <li>
            {t("Nếu file chính hỏng, app tự lấy bản sao lưu mới nhất còn đọc được và cất file hỏng sang thư mục")} <span className="mono">corrupt</span> {t("để soi lại.")}
          </li>
          <li>
            {t("Muốn chắc ăn hơn nữa thì thỉnh thoảng bấm “Xuất bản sao lưu” rồi cất lên Google Drive.")}
          </li>
        </ul>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">{t("Chu kỳ ôn tập")}</div>
        </div>
        <p className="muted small">
          {t("Làm đúng thì bài lên một cấp và hẹn ôn lại xa hơn. Làm sai thì về cấp 1, mai ôn lại. Đây đúng là chu kỳ trong file Excel gốc của bạn.")}
        </p>
        <div className="chip-row" style={{ marginTop: 10 }}>
          {[1, 3, 7, 14, 30, 90].map((days, index) => (
            <span key={days} className="chip">
              {t2("Cấp {cap} · {n} ngày", { cap: index + 1, n: days })}
            </span>
          ))}
        </div>
      </div>
      {/* Ghi công tác giả, đặt ở cuối Cài đặt và hiện trên MỌI cỡ màn hình.
          Trước đây khối này mang class only-mobile nên bản máy tính không thấy
          — ở đó nó chỉ là một nút nhỏ nép cuối thanh bên. */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">{t("Về tác giả")}</div>
        </div>
        <div className="about-credit">
          <VietnamFlag size={26} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="about-credit-name">{t("Nyren Phạm")}</div>
            <div className="small dim">{t("Ninh Bình, Việt Nam")}</div>
          </div>
          <button className="btn" onClick={onAbout}>
            {t("Xem thêm")}
          </button>
        </div>
        <p className="muted small" style={{ marginTop: 10 }}>
          {t("Cựu sinh viên khoa Tự động hoá, Đại học Bách Khoa Hà Nội. Làm công cụ này để việc ôn")} <span className="ja">電験三種</span> {t("đỡ vất vả hơn.")}
        </p>
      </div>

    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Đồng bộ tự động qua GitHub                                          */
/* ------------------------------------------------------------------ */

const STATE_TEXT: Record<string, string> = {
  off: "Đang tắt",
  idle: "Đang bật",
  running: "Đang đồng bộ…",
  done: "Đã đồng bộ",
  error: "Có lỗi",
};

/** "2026-08-13T04:20:11.000Z" -> "13/08 11:20" theo giờ máy. */
function whenText(iso: string): string {
  if (!iso) return t("chưa lần nào");
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return t("chưa lần nào");
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(at.getDate())}/${pad(at.getMonth() + 1)} ${pad(at.getHours())}:${pad(at.getMinutes())}`;
}

function CloudSyncCard({ sync }: { sync: Sync }) {
  const [repo, setRepo] = useState(sync.config.repo);
  const [token, setToken] = useState(sync.config.token);
  const [showToken, setShowToken] = useState(false);
  const [checking, setChecking] = useState(false);
  const [check, setCheck] = useState<{ kind: string; text: string } | null>(null);
  // Cấu hình nạp từ đĩa xong mới có giá trị thật; đồng bộ vào ô nhập một lần.
  const [filled, setFilled] = useState(false);
  if (sync.ready && !filled) {
    setFilled(true);
    setRepo(sync.config.repo);
    setToken(sync.config.token);
  }

  const dirty = repo !== sync.config.repo || token !== sync.config.token;

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          {t("Đồng bộ tự động qua GitHub")}
          <div className="card-sub">
            {t("Máy tính và điện thoại cùng đọc ghi một file trong repo riêng tư của bạn")}
          </div>
        </div>
        <span className={`sync-badge ${sync.state}`}>{t(STATE_TEXT[sync.state] ?? "")}</span>
      </div>

      <div className="callout" style={{ marginBottom: 14 }}>
        {t("Tự chạy lúc mở app, lúc quay lại app, và mỗi 5 phút. Vẫn là")} <strong>{t("gộp chứ không ghi đè")}</strong>{t(": hai máy cùng ghi một lúc thì bên sau đọc lại rồi gộp lại, không bên nào mất.")}
      </div>

      <div className="field">
        <label className="field-label" htmlFor="sync-repo">
          {t("Repo riêng tư (tài-khoản/tên-repo)")}
        </label>
        <input
          id="sync-repo"
          className="input"
          placeholder="heynyren/denken-du-lieu"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={repo}
          onChange={(event) => setRepo(event.target.value.trim())}
        />
        <div className="field-hint">
          {t("Tạo một repo")} <strong>{t("trống và Private")}</strong> {t("riêng cho dữ liệu, đừng dùng chung repo mã nguồn.")}
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="sync-token">
          Token GitHub
        </label>
        <div className="row" style={{ gap: 8 }}>
          <input
            id="sync-token"
            className="input"
            style={{ flex: 1, minWidth: 0 }}
            type={showToken ? "text" : "password"}
            placeholder="github_pat_…"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={token}
            onChange={(event) => setToken(event.target.value.trim())}
          />
          <button
            className="btn sm ghost"
            onClick={() => setShowToken((on) => !on)}
            title={showToken ? t("Giấu token") : t("Hiện token")}
          >
            <Ic i={showToken ? EyeOff : Eye} />
          </button>
        </div>
        <div className="field-hint">
          {t("Token nằm riêng,")} <strong>{t("không")}</strong> {t("nằm trong data.json — nên file bạn xuất ra hay chép sang Drive không mang theo nó.")}
        </div>
      </div>

      <div className="btn-row" style={{ marginTop: 12 }}>
        <button
          className="btn sm"
          disabled={checking || !repo || !token}
          onClick={async () => {
            setChecking(true);
            setCheck(null);
            const result = await checkAccess(
              { repo, token, file: sync.config.file },
              (url, init) => fetch(url, init),
            );
            setChecking(false);
            if (!result.ok) {
              setCheck({ kind: "danger", text: result.error });
              return;
            }
            await sync.saveConfig({ repo, token });
            setCheck(
              result.private
                ? { kind: "", text: t("Kết nối được. Repo đang là Private, đúng rồi.") }
                : {
                    kind: "danger",
                    text:
                      t("Kết nối được, NHƯNG repo này đang công khai — ghi chú của bạn") +
                      " " +
                      t("sẽ ai cũng đọc được. Chuyển sang Private đi đã."),
                  },
            );
          }}
        >
          {checking ? (
            t("Đang kiểm tra…")
          ) : (
            <>
              <Ic i={Plug} /> {t("Kiểm tra kết nối")}
            </>
          )}
        </button>

        <button
          className={`btn sm ${sync.config.enabled ? "danger" : "primary"}`}
          disabled={!sync.config.repo || !sync.config.token}
          onClick={() => void sync.saveConfig({ enabled: !sync.config.enabled })}
        >
          {sync.config.enabled ? (
            <>
              <Ic i={Pause} /> {t("Tắt đồng bộ")}
            </>
          ) : (
            <>
              <Ic i={Play} /> {t("Bật đồng bộ")}
            </>
          )}
        </button>

        <button
          className="btn sm"
          disabled={!sync.config.enabled || sync.state === "running"}
          onClick={() => void sync.run(true)}
        >
          <Ic i={RefreshCw} /> {t("Đồng bộ ngay")}
        </button>

        {dirty && (
          <span className="field-hint" style={{ flex: 1, minWidth: 200 }}>
            {t("Bấm")} <strong>{t("Kiểm tra kết nối")}</strong> {t("để lưu phần vừa sửa.")}
          </span>
        )}
      </div>

      {check && (
        <div className={`callout ${check.kind}`} style={{ marginTop: 12 }}>
          {check.text}
        </div>
      )}

      {sync.note && (
        <div
          className={`callout ${sync.state === "error" ? "danger" : ""}`}
          style={{ marginTop: 12 }}
        >
          {sync.note}
        </div>
      )}

      <div className="field-hint" style={{ marginTop: 10 }}>
        {t2("Lần đồng bộ gần nhất: {luc}.", { luc: whenText(sync.config.lastSyncAt) })}{" "}
        {t("Ảnh đính kèm không đi theo — chỉ tiến độ, ghi chú, link và lịch sử thi.")}
      </div>
    </div>
  );
}
