/**
 * Máy này đang có sẵn đề thi PDF nào.
 *
 * Hỏi nền tảng đúng một lần lúc mở app rồi giữ lại. Không hỏi theo từng câu:
 * một đề 18 câu thì thành 18 lượt đi qua cầu nối native để hỏi về cùng một
 * file — đủ để thấy nút nhấp nháy trong lúc vẽ đề.
 *
 * Trả về `Set` chứ không phải mảng vì chỗ dùng chỉ cần hỏi "có cái này không".
 */

import { useEffect, useState } from "react";

import { platform } from "../platform";

export function useDeThi(): Set<string> {
  const [co, setCo] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let bỏ = false;
    void (async () => {
      try {
        const ten = await platform.deThiCo();
        if (!bỏ) setCo(new Set(ten));
      } catch {
        // Không đọc được thư mục đề thì coi như chưa có đề nào — app lùi về
        // link denken-ou.com, chứ không phải hỏng cả màn thi thử.
      }
    })();
    return () => {
      bỏ = true;
    };
  }, []);

  return co;
}
