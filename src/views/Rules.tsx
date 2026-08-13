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
          eyebrow="Bốn môn trong một ngày"
          title="Giờ thi từng môn"
          hint="Có mặt trong phòng trước giờ bắt đầu 20 phút. Quá 30 phút sau giờ bắt đầu là hết quyền vào."
        />
        <div className="dx-grid grid-cols-2 gap-2 lg:grid-cols-4">
          {GIO_THI.map((mon) => (
            <div
              key={mon.mon}
              className="rounded-row bg-sunken p-3 text-center ring-[0.5px] ring-hairline"
            >
              <div className="ja text-lead font-semibold">{mon.mon}</div>
              <div className="text-micro text-ink-3">{mon.vi}</div>
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
            eyebrow={nhom.ja}
            title={nhom.vi}
            hint={nhom.dan}
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
                      Mất quyền thi
                    </Badge>
                  )}
                  <p className="min-w-0 flex-1 text-body text-ink">{muc.vi}</p>
                </div>
                <p className="ja mt-1.5 text-tiny text-ink-3">{muc.ja}</p>
              </li>
            ))}
          </ul>
        </Panel>
      ))}

      <Panel>
        <PanelHead
          icon={StickyNote}
          eyebrow="Của riêng bạn"
          title="Ghi chú cho hôm thi"
          hint="Ga nào xuống, mấy giờ ra khỏi nhà, mang theo gì. Đồng bộ sang điện thoại như mọi ghi chú khác."
        />
        <textarea
          className="textarea"
          rows={6}
          placeholder={
            "Ví dụ:\n" +
            "- 6:30 ra khỏi nhà, đổi tàu ở Shibuya\n" +
            "- Mang máy tính CASIO fx-JP500 (có phím √), đồng hồ kim\n" +
            "- Cơm nắm ăn giữa 電力 và 機械 (nghỉ 1 tiếng 20)"
          }
          value={nhap}
          onChange={(event) => setNhap(event.target.value)}
        />
        <div className="mt-3 flex items-center gap-3">
          <Button tone="accent" size="sm" onClick={luu} disabled={nhap === (ghiChu?.text ?? "")}>
            Lưu ghi chú
          </Button>
          {daLuu && <span className="text-small text-good">Đã lưu.</span>}
        </div>
      </Panel>

      <Panel>
        <PanelHead
          icon={ExternalLink}
          eyebrow="Nguồn"
          title="Trang chính thức của trung tâm khảo thí"
          hint="Sơ đồ hội trường, tra kết quả, và bản quy chế đầy đủ đều ở đây."
        />
        <Button
          size="sm"
          onClick={() => void platform.openExternal(TRANG_CHINH_THUC)}
        >
          <Ic i={ExternalLink} /> shiken.or.jp
        </Button>
        <p className="mt-3 text-tiny text-ink-4">
          Phần trên chép từ tờ 受験票 và tờ hướng dẫn kèm theo. Quy chế có thể đổi
          theo từng kỳ — sát ngày thi nên mở trang chính thức xem lại một lượt.
        </p>
      </Panel>
    </div>
  );
}
