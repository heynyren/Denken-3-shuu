/**
 * Danh mục bài tập — phần "code" của app.
 *
 * File catalog.json được sinh ra từ Excel bằng scripts/convert-excel.py và đóng
 * gói cùng bản cài đặt. Nó chỉ chứa thông tin chung cho mọi người dùng
 * (tên bài, chủ đề, độ khó, link denken-ou.com), tuyệt đối không chứa ghi chú
 * hay link tham khảo riêng của ai.
 */

import raw from "../data/catalog.json";
import type { Catalog, CatalogItem, SubjectKey } from "./types";

export const catalog = raw as unknown as Catalog;
export const items: CatalogItem[] = catalog.items;
export const subjects = catalog.subjects;

export const itemById = new Map(items.map((item) => [item.id, item]));

export const subjectByKey = new Map(subjects.map((s) => [s.key, s]));

/** Danh sách chủ đề của mỗi môn, giữ đúng thứ tự xuất hiện trong Excel. */
export const topicsBySubject: Record<SubjectKey, string[]> = (() => {
  const map = {} as Record<SubjectKey, string[]>;
  for (const subject of subjects) map[subject.key] = [];
  for (const item of items) {
    const list = map[item.subject];
    if (list && !list.includes(item.topic)) list.push(item.topic);
  }
  return map;
})();

export function subjectName(key: SubjectKey): string {
  return subjectByKey.get(key)?.name ?? key;
}

export function subjectViName(key: SubjectKey): string {
  return subjectByKey.get(key)?.viName ?? key;
}
