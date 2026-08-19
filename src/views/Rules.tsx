/**
 * Màn Luật thi — quy chế kỳ thi 電験三種, kèm chỗ tự ghi chú.
 *
 * Hai phần tách bạch:
 *
 *   - Phần trên là quy chế, nằm trong code (`src/data/luat-thi.ts`). Ai cài app
 *     cũng thấy giống nhau, cập nhật app là cập nhật theo.
 *   - Phần dưới là ghi chú của riêng bạn — ga nào xuống, mấy giờ ra khỏi nhà,
 *     mang theo gì. Nằm trong dữ liệu, đồng bộ được sang điện thoại.
 *
 * Đúng ranh giới code/dữ liệu của cả dự án, xem README.
 */

import { useState } from "react";
import {
  AlertTriangle,
  Calculator,
  Clock,
  ExternalLink,
  Footprints,
  HeartPulse,
  Backpack,
  ShieldAlert,
  StickyNote,
  UserRoundX,
} from "lucide-react";

import { GIO_THI, LUAT, TRANG_CHINH_THUC } from "../data/luat-thi";
import type { IconType } from "../components/ui/icon";
import { Ic } from "../components/ui/icon";
import { Panel, PanelHead } from "../components/ui/panel";
import { Badge, Button } from "../components/ui/primitives";
import { platform } from "../platform";
import type { Store } from "../state/useStore";

import { ngon, t } from "../lib/chu";
/** Id bài giả để ghi chú riêng của bạn về kỳ thi có chỗ mà nằm. */
const GHI_CHU_ID = "__luat-thi__";

const ICON: Record<string, IconType> = {
  "khong-duoc-thi": UserRoundX,
  "mang-gi": Backpack,
  "may-tinh": Calculator,
  "trong-phong": ShieldAlert,
  "di-lai": Footprints,
  "suc-khoe": HeartPulse,
  "canh-giac": AlertTriangle,
};

/**
 * Quy chế thi thì KHÔNG dịch thêm một lần nữa: dịch trật một dòng quy chế là
 * người đọc mất quyền thi. Trong dữ liệu đã có sẵn NGUYÊN VĂN tiếng Nhật —
 * đúng thứ giám thị đọc và đúng thứ in trên tờ giấy — nên ở chế độ tiếng Nhật
 * hiện thẳng nguyên văn, còn các thứ tiếng khác giữ bản tiếng Việt và nguyên
 * văn vẫn nằm ngay dưới như cũ.
 */
const luat = (vi: string, ja: string) => (ngon() === "ja" ? ja : vi);

/** Câu dẫn viết dạng "nguyên văn — bản dịch"; chế độ tiếng Nhật chỉ lấy nguyên văn. */
const dan = (s?: string) => (s && ngon() === "ja" ? s.split(" — ")[0] : s);

export default function Rules({ store }: { store: Store }) {
  const data = store.data!;
  const ghiChu = data.progress[GHI_CHU_ID]?.notes[0];
  const [nhap, setNhap] = useState(ghiChu?.text ?? "");
  const [daLuu, setDaLuu] = useState(false);

  const luu = () => {
    const hienCo = data.progress[GHI_CHU_ID]?.notes[0];
    const id = hienCo?.id ?? store.addNote(GHI_CHU_ID);
    store.setNoteText(GHI_CHU_ID, id, nhap);
    setDaLuu(true);
    window.setTimeout(() => setDaLuu(false), 2000);
  };

  return (
    <div className="container">
      <Panel>
        <PanelHead
          icon={Clock}
          eyebrow={t("Bốn môn trong một ngày")}
          title={t("Giờ thi từng môn")}
          hint={t("Có mặt trong phòng trước giờ bắt đầu 20 phút. Quá 30 phút sau giờ bắt đầu là hết quyền vào.")}
        />
        <div className="dx-grid grid-cols-2 gap-2 lg:grid-cols-4">
          {GIO_THI.map((mon) => (
            <div
              key={mon.mon}
              className="rounded-row bg-sunken p-3 text-center ring-[0.5px] ring-hairline"
            >
              <div className="ja text-lead font-semibold">{mon.mon}</div>
              <div className="text-micro text-ink-3">{t(mon.vi)}</div>
              <div className="mt-2 text-body font-semibold tabular-nums">
                {mon.batDau}
              </div>
              <div className="text-tiny tabular-nums text-ink-3">↓ {mon.ketThuc}</div>
            </div>
          ))}
        </div>
      </Panel>

      {LUAT.map((nhom) => (
        <Panel key={nhom.id}>
          <PanelHead
            icon={ICON[nhom.id]}
            eyebrow={ngon() === "ja" ? nhom.vi : nhom.ja}
            title={luat(nhom.vi, nhom.ja)}
            hint={dan(nhom.dan)}
          />
          <ul className="flex list-none flex-col gap-3 p-0">
            {nhom.muc.map((muc) => (
              <li
                key={muc.ja}
                className={`rounded-row p-3 ${
                  muc.nghiem ? "bg-bad-soft" : "bg-sunken"
                }`}
              >
                <div className="flex items-start gap-2">
                  {muc.nghiem && (
                    <Badge tone="bad" className="mt-0.5 shrink-0">
                      {t("Mất quyền thi")}
                    </Badge>
                  )}
                  <p className="min-w-0 flex-1 text-body text-ink">{luat(muc.vi, muc.ja)}</p>
                </div>
                {ngon() !== "ja" && (
                  <p className="ja mt-1.5 text-tiny text-ink-3">{muc.ja}</p>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      ))}

      <Panel>
        <PanelHead
          icon={StickyNote}
          eyebrow={t("Của riêng bạn")}
          title={t("Ghi chú cho hôm thi")}
          hint={t("Ga nào xuống, mấy giờ ra khỏi nhà, mang theo gì. Đồng bộ sang điện thoại như mọi ghi chú khác.")}
        />
        <textarea
          className="textarea"
          rows={6}
          placeholder={
            t("Ví dụ:") + "\n" +
            t("- 6:30 ra khỏi nhà, đổi tàu ở Shibuya") + "\n" +
            t("- Mang máy tính CASIO fx-JP500 (có phím √), đồng hồ kim") + "\n" +
            t("- Cơm nắm ăn giữa 電力 và 機械 (nghỉ 1 tiếng 20)")
          }
          value={nhap}
          onChange={(event) => setNhap(event.target.value)}
        />
        <div className="mt-3 flex items-center gap-3">
          <Button tone="accent" size="sm" onClick={luu} disabled={nhap === (ghiChu?.text ?? "")}>
            {t("Lưu ghi chú")}
          </Button>
          {daLuu && <span className="text-small text-good">{t("Đã lưu.")}</span>}
        </div>
      </Panel>

      <Panel>
        <PanelHead
          icon={ExternalLink}
          eyebrow={t("Nguồn")}
          title={t("Trang chính thức của trung tâm khảo thí")}
          hint={t("Sơ đồ hội trường, tra kết quả, và bản quy chế đầy đủ đều ở đây.")}
        />
        <Button
          size="sm"
          onClick={() => void platform.openExternal(TRANG_CHINH_THUC)}
        >
          <Ic i={ExternalLink} /> shiken.or.jp
        </Button>
        <p className="mt-3 text-tiny text-ink-4">
          {t("Phần trên chép từ tờ 受験票 và tờ hướng dẫn kèm theo. Quy chế có thể đổi theo từng kỳ — sát ngày thi nên mở trang chính thức xem lại một lượt.")}
        </p>
      </Panel>
    </div>
  );
}
