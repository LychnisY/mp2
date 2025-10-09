import { DAMAGE_ORDER, SCHOOL_ORDER } from "./constants";
import { Student } from "./types";

export type SortKey = "school" | "name" | "damage";
export type SortDir = "asc" | "desc";

const schoolRank = new Map(SCHOOL_ORDER.map((s, i) => [s.toLowerCase(), i]));
const damageRank = new Map(DAMAGE_ORDER.map((d, i) => [d.toLowerCase(), i]));

function cmp(a: number, b: number) { return a - b; }
function flip(n: number, dir: SortDir) { return dir === "asc" ? n : -n; }

export function sortStudents(items: Student[], key: SortKey, dir: SortDir): Student[] {
  const copy = [...items];
  copy.sort((A, B) => {
    if (key === "school") {
      const ra = schoolRank.get((A.school ?? "").toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      const rb = schoolRank.get((B.school ?? "").toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      return flip(cmp(ra, rb) || A.name.localeCompare(B.name), dir);
    }
    if (key === "name") {
      return flip(A.name.localeCompare(B.name), dir);
    }
    // damage
    const ra = damageRank.get((A.damageType ?? "").toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
    const rb = damageRank.get((B.damageType ?? "").toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
    return flip(cmp(ra, rb) || A.name.localeCompare(B.name), dir);
  });
  return copy;
}

export function filterByQuery(items: Student[], q: string): Student[] {
  if (!q.trim()) return items;
  const s = q.trim().toLowerCase();
  return items.filter(v =>
    v.name?.toLowerCase().includes(s) ||
    v.school?.toLowerCase().includes(s) ||
    v.damageType?.toLowerCase().includes(s)
  );
}