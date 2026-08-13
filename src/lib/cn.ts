/**
 * Gộp danh sách lớp CSS, bản sau đè bản trước khi trùng nhóm.
 *
 * Đây là hàm `cn` quen thuộc của shadcn/ui. `clsx` lo phần bật/tắt lớp theo
 * điều kiện, `twMerge` lo phần khử trùng: viết `px-2` rồi truyền thêm `px-4` thì
 * chỉ còn `px-4`, chứ không để cả hai cùng nằm đó rồi tuỳ thứ tự trong file CSS
 * mà bên nào thắng.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
