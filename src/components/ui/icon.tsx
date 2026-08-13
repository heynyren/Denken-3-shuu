/**
 * Icon dùng chung, lấy từ bộ Lucide.
 *
 * Vì sao bỏ hết emoji
 * -------------------
 * Emoji do PHÔNG CHỮ CỦA MÁY vẽ chứ không phải app vẽ. Cùng một ký tự 🎯, máy
 * Windows ra hình phẳng nhiều màu, máy Android ra hình tròn mập, máy cũ ra kiểu
 * của năm 2015. App không chỉnh được nét, không chỉnh được màu, không chỉnh được
 * cỡ cho khớp chữ — và cạnh chữ tiếng Việt có dấu thì luôn lệch chân.
 *
 * Lucide là SVG do app kèm theo: cùng một tay vẽ, chỉnh được độ dày nét, và ăn
 * theo màu chữ xung quanh nhờ `currentColor`.
 */

import type { ComponentType } from "react";

import { cn } from "../../lib/cn";

export type IconType = ComponentType<{
  className?: string;
  strokeWidth?: number;
}>;

/**
 * Icon đặt lẫn trong dòng chữ, ví dụ trong nhãn nút.
 *
 * Cỡ 16 và `shrink-0`: nhỏ hơn thì mờ ở màn hình thường, mà không khoá co lại
 * thì nó bị bóp méo khi nhãn nút dài hơn chỗ trống.
 */
export function Ic({
  i: Icon,
  className,
  strokeWidth = 1.75,
}: {
  i: IconType;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <Icon
      className={cn("h-4 w-4 shrink-0", className)}
      strokeWidth={strokeWidth}
    />
  );
}
