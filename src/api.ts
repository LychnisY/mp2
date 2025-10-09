// api.ts
import axios from "axios";
import { API_BASE } from "./constants";
import { Student } from "./types";

export function normalizeStudent(raw: any): Student {
  return {
    id: String(raw._id),
    name: raw.name,
    school: raw.school,
    damageType: raw.damageType,
    birthday: raw.birthday,
    portraitUrl: raw.photoUrl || raw.image || "",
    schoolImageUrl: raw.imageSchool || "",

  };
}

function unwrapList(d: any): any[] {
  if (Array.isArray(d)) return d;            // 极少数实现直接返回数组
  if (d && Array.isArray(d.data)) return d.data; // /api/characters -> { data: [...] }
  return [];
}

export interface PageResult {
  items: Student[];
  page: number;
  perPage: number;
  /** 全库分页有意义；学校分页可能拿不到 */
  total?: number;
  /** 是否还有下一页（学校分页就靠这个判断） */
  hasMore: boolean;
}

/** 全库分页：/api/characters?page=N&perPage=M */
export async function fetchStudentsPage(page = 1, perPage = 20): Promise<PageResult> {
  const { data } = await axios.get(`${API_BASE}/api/characters`, {
    params: { page, perPage },
    timeout: 15000,
  });
  const items = unwrapList(data).map(normalizeStudent);
  const total = typeof data?.dataAllPage === "number" ? data.dataAllPage : items.length;
  const hasMore = page * perPage < total;
  return { items, total, page, perPage, hasMore };
}

/** 按学校分页：/api/characters?school=...&page=N&perPage=M
 *  有些实现不返回 total，所以只用 items.length === perPage 来判断 hasMore
 */
export async function fetchSchoolPage(school: string, page = 1, perPage = 20): Promise<PageResult> {
  const { data } = await axios.get(`${API_BASE}/api/characters`, {
    params: { school, page, perPage },
    timeout: 15000,
  });
  const items = unwrapList(data).map(normalizeStudent);
  const hasMore = items.length === perPage; // 这一页满了，可能还有下一页；不足一页就没有了
  const total = typeof data?.dataAllPage === "number" ? data.dataAllPage : undefined;
  return { items, total, page, perPage, hasMore };
}


export async function fetchByName(name: string): Promise<Student[]> {
  const { data } = await axios.get(`${API_BASE}/api/characters`, {
    params: { name },
    timeout: 15000,
  });
  const arr = unwrapList(data);
  return arr.map(normalizeStudent);
}
