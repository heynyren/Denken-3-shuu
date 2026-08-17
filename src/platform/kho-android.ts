/**
 * Kho dữ liệu của bản Android — phần lý lẽ, tách hẳn khỏi Capacitor.
 *
 * Vì sao tách ra
 * --------------
 * Người dùng báo: chạy app trên điện thoại, không bật đồng bộ, dữ liệu không
 * giữ được. Trước đây toàn bộ đoạn ghi/đọc nằm thẳng trong `android.ts`, gọi
 * trực tiếp plugin Capacitor — mà plugin thì chỉ chạy được trong máy Android
 * thật. Nghĩa là không có cách nào kiểm chứng được đường ghi ấy đúng hay sai;
 * chỉ đọc mã rồi đoán.
 *
 * Ở đây mọi thao tác đĩa đi qua interface `TepAndroid`. Bản chạy thật cắm
 * Capacitor vào, còn bộ kiểm thử cắm một hệ file giả trong bộ nhớ — giả được cả
 * trường hợp **đổi tên file không chạy được**, thứ đã làm mất sạch dữ liệu.
 *
 * Ba lỗi đã tìm ra và sửa ở đây
 * -----------------------------
 *
 * 1. **Xoá trước, đổi tên sau.** Đường ghi cũ làm đúng ba bước: ghi ra
 *    `data.json.tmp`, XOÁ `data.json`, rồi đổi tên bản tạm thành `data.json`.
 *    Nếu bước đổi tên hỏng — mà trên Android nó hỏng thật ở một số máy — thì
 *    `data.json` đã bị xoá mất rồi, còn bản tạm thì vẫn mang tên tạm. Kết quả:
 *    không còn file dữ liệu nào cả. Đây gần như chắc chắn là lỗi người dùng gặp.
 *
 * 2. **Mất file thì coi như máy mới.** `load()` cũ: đọc `data.json` không thấy
 *    thì trả về sổ trắng. Không thấy có thể là do lần đầu cài app thật, nhưng
 *    cũng có thể là do lỗi (1) vừa nói. Thư mục `backups/` nằm ngay cạnh, có
 *    bản của hôm qua, mà không ai ngó tới. Nay khi mất file thì đi lần lượt:
 *    bản tạm → bản sao lưu mới nhất → sổ trắng. Chỉ khi không còn dấu vết gì
 *    mới thật sự là máy mới.
 *
 * 3. **Ghi xong không đọc lại.** Ghi báo thành công không có nghĩa là byte đã
 *    nằm đúng trên đĩa. Nay ghi xong đọc lại đối chiếu, lệch một chữ là coi như
 *    hỏng và giữ nguyên file cũ.
 */

import { emptyAppData } from "../lib/defaults";
import type { AppData } from "../lib/types";

/* ------------------------------------------------------------------ */
/* Hệ file                                                             */
/* ------------------------------------------------------------------ */

/** Vài thao tác đĩa mà kho cần. Bản thật dùng Capacitor, bản kiểm thử dùng Map. */
export interface TepAndroid {
  /** Đọc file văn bản. Không có file thì `null` — không ném lỗi. */
  doc(path: string): Promise<string | null>;
  ghi(path: string, text: string): Promise<void>;
  xoa(path: string): Promise<void>;
  doiTen(from: string, to: string): Promise<void>;
  /** Tên các file trong thư mục. Không có thư mục thì mảng rỗng. */
  liet(path: string): Promise<string[]>;
  taoThuMuc(path: string): Promise<void>;
}

export const FILE = "data.json";
export const TMP = "data.json.tmp";
export const BACKUPS = "backups";
export const CORRUPT = "corrupt";
const KEEP_BACKUPS = 30;

/**
 * Cách ghi đè file đang dùng trên máy này.
 *
 * `Filesystem.rename` của Capacitor có máy chạy, có máy không, mà không có cách
 * nào biết trước ngoài thử. Thử một lần rồi nhớ lấy: nếu máy này đổi tên không
 * được thì những lần ghi sau đi thẳng đường ghi đè, khỏi phải hỏng thêm hai lời
 * gọi nữa mỗi lần lưu.
 */
type Cach = "doi-ten" | "xoa-roi-doi-ten" | "ghi-thang";

/* ------------------------------------------------------------------ */
/* Kho                                                                 */
/* ------------------------------------------------------------------ */

export interface KhoAndroid {
  load(): Promise<AppData>;
  save(data: AppData): Promise<{ ok: boolean; path?: string; error?: string }>;
  /** Cách ghi đang dùng — để kiểm thử soi, và để màn Cài đặt hiện ra khi cần. */
  cachGhi(): Cach;
  demSaoLuu(): Promise<number>;
}

const homNay = () => new Date().toISOString().slice(0, 10);

export function taoKhoAndroid(fs: TepAndroid): KhoAndroid {
  let cach: Cach = "doi-ten";

  /** Ghi rồi đọc lại đối chiếu. Lệch là hỏng, chứ không tin lời báo thành công. */
  async function ghiVaSoat(path: string, text: string): Promise<void> {
    await fs.ghi(path, text);
    const lai = await fs.doc(path);
    if (lai !== text) {
      throw new Error(`Ghi ${path} xong đọc lại không khớp.`);
    }
  }

  /**
   * Ghi đè `data.json` sao cho **không lúc nào không có file dữ liệu**.
   *
   * Điểm khác cốt lõi so với bản cũ: không xoá `data.json` trước rồi mới đổi
   * tên. Thứ tự ở đây là đổi tên trước; chỉ khi nào máy này đòi đích phải trống
   * mới xoá; và nếu đổi tên vẫn không xong thì ghi đè thẳng. Đường nào cũng kết
   * thúc bằng một `data.json` đọc được.
   */
  async function ghiNguyenTu(text: string): Promise<void> {
    if (cach === "ghi-thang") {
      await ghiVaSoat(FILE, text);
      return;
    }

    // Bản tạm phải ra đĩa đủ và đúng thì mới dám đụng tới file thật.
    await ghiVaSoat(TMP, text);

    if (cach === "doi-ten") {
      try {
        await fs.doiTen(TMP, FILE);
        return;
      } catch {
        // Có thể chỉ vì đích đang có sẵn. Thử kiểu xoá-rồi-đổi-tên.
      }
    }

    try {
      await fs.xoa(FILE);
    } catch {
      // Chưa có file để xoá — lần ghi đầu tiên.
    }
    try {
      await fs.doiTen(TMP, FILE);
      cach = "xoa-roi-doi-ten";
      return;
    } catch {
      // Máy này đổi tên không được. Vừa xoá mất file thật, phải dựng lại ngay.
    }

    cach = "ghi-thang";
    await ghiVaSoat(FILE, text);
    try {
      await fs.xoa(TMP);
    } catch {
      // Còn sót bản tạm cũng không sao, lần ghi sau đè lên.
    }
  }

  /** Mỗi ngày giữ một bản, giữ 30 bản gần nhất. */
  async function saoLuuTrongNgay(text: string): Promise<void> {
    await fs.taoThuMuc(BACKUPS);
    const ten = `data-${homNay()}.json`;
    const co = await fs.liet(BACKUPS);
    if (co.includes(ten)) return;

    await fs.ghi(`${BACKUPS}/${ten}`, text);

    const cu = co.filter((n) => n.endsWith(".json")).sort();
    for (const bo of cu.slice(0, Math.max(0, cu.length - KEEP_BACKUPS + 1))) {
      try {
        await fs.xoa(`${BACKUPS}/${bo}`);
      } catch {
        // Xoá không được thì thôi, không đáng để hỏng cả lần ghi.
      }
    }
  }

  /** Bản sao lưu mới nhất còn đọc được. */
  async function banSaoConDung(): Promise<AppData | null> {
    const ten = (await fs.liet(BACKUPS))
      .filter((n) => n.endsWith(".json"))
      .sort()
      .reverse();
    for (const n of ten) {
      const text = await fs.doc(`${BACKUPS}/${n}`);
      if (!text) continue;
      try {
        return JSON.parse(text) as AppData;
      } catch {
        continue; // bản này hỏng, lùi thêm một ngày
      }
    }
    return null;
  }

  /** Cất file hỏng sang `corrupt/` để còn soi lại, chứ không xoá thẳng. */
  async function cachLy(text: string): Promise<void> {
    await fs.taoThuMuc(CORRUPT);
    const moc = new Date().toISOString().replace(/[:.]/g, "-");
    try {
      await fs.ghi(`${CORRUPT}/data-${moc}.json`, text);
    } catch {
      // Cứu được dữ liệu quan trọng hơn là giữ được file hỏng.
    }
  }

  return {
    cachGhi: () => cach,

    async demSaoLuu() {
      return (await fs.liet(BACKUPS)).filter((n) => n.endsWith(".json")).length;
    },

    async load() {
      const text = await fs.doc(FILE);

      if (text !== null) {
        try {
          const data = JSON.parse(text) as AppData;
          await saoLuuTrongNgay(text);
          return data;
        } catch {
          // data.json có mà hỏng — cất đi rồi lùi về bản sao lưu.
          await cachLy(text);
          return (await banSaoConDung()) ?? emptyAppData();
        }
      }

      /* Không có data.json. Đây là chỗ bản cũ trả về sổ trắng và mất sạch dữ
         liệu. Còn hai nơi nữa phải tìm trước khi kết luận là máy mới. */

      // 1. Bản tạm: lần ghi trước ra đĩa xong nhưng chưa kịp thành file thật.
      //    Nó chính là bản MỚI NHẤT, mới hơn cả bản sao lưu.
      const tam = await fs.doc(TMP);
      if (tam !== null) {
        try {
          const data = JSON.parse(tam) as AppData;
          // Dựng lại file thật ngay, đừng để lần mở sau lại phải cứu tiếp.
          await ghiNguyenTu(tam);
          return data;
        } catch {
          // Bản tạm cụt đuôi vì mất điện giữa chừng — bỏ, xuống bản sao lưu.
        }
      }

      // 2. Bản sao lưu hằng ngày.
      const sao = await banSaoConDung();
      if (sao) {
        await ghiNguyenTu(JSON.stringify(sao));
        return sao;
      }

      // 3. Không còn dấu vết nào: đúng là lần đầu mở app.
      return emptyAppData();
    },

    async save(data) {
      const text = JSON.stringify(data);
      try {
        await ghiNguyenTu(text);
        // Có dữ liệu tốt trong tay rồi mới sao lưu, và sao lưu hỏng thì lần lưu
        // vẫn tính là thành công — file chính mới là thứ quan trọng.
        try {
          await saoLuuTrongNgay(text);
        } catch {
          /* bỏ qua */
        }
        return { ok: true, path: FILE };
      } catch (cause) {
        return { ok: false, error: (cause as Error).message };
      }
    },
  };
}
