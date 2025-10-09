// src/views/DetailView.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Student } from "../types";
import { fetchByName } from "../api";

type DetailState = {
  /** 列表页点进来时可直接带上选中项，减少一次请求 */
  student?: Student;
  /** 用于 Prev/Next 的“可见列表”上下文（只需要 name 和 school 即可） */
  list?: { name: string; school?: string }[];
  /** 当前项在 list 中的索引，可选 */
  index?: number;
};

function pickBySchool(list: Student[], school?: string): Student | null {
  if (!list?.length) return null;
  if (!school) return list[0] ?? null;
  const target = list.find(
    x => (x.school ?? "").toLowerCase() === school.toLowerCase()
  );
  return target ?? list[0] ?? null;
}

export default function DetailView() {
  const { name = "" } = useParams<{ name: string }>();
  const decodedName = decodeURIComponent(name);
  const [searchParams] = useSearchParams();
  const schoolQS = searchParams.get("school") || undefined;
  
  const location = useLocation();
  const state = (location.state ?? {}) as DetailState;

  const [current, setCurrent] = useState<Student | null>(state.student ?? null);
  const [loading, setLoading] = useState(!state.student);
  const [error, setError] = useState<string | null>(null);

  // 刷新或直达：按名字远程取详情（API: /api/characters?name=...）
  useEffect(() => {
    setError(null);
    (async () => {
      try {
        const list = await fetchByName(decodedName);
        const s = pickBySchool(list, schoolQS);
        if (s) {
          // 如果是从列表页带来的简略数据，这里做“补全/覆盖”
          setCurrent(prev => ({ ...(prev ?? {} as Student), ...s }));
        }
      } catch (e: any) {
        setError(e?.message ?? "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [decodedName, schoolQS]);

  // Prev/Next：仅当从列表页带来上下文时启用
  const siblings = state.list ?? null;
  const index = useMemo(() => {
    if (!siblings || !current) return -1;
    const i = siblings.findIndex(x =>
      x.name === current.name &&
      (!schoolQS || (x.school ?? "").toLowerCase() === schoolQS.toLowerCase())
    );
    return i;
  }, [siblings, current, schoolQS]);

  const prevMeta = siblings && index > 0 ? siblings[index - 1] : undefined;
  const nextMeta = siblings && index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : undefined;

  const nav = useNavigate();
  const goSibling = (meta?: { name: string; school?: string }, step = 0) => {
    if (!meta) return;
    nav(
      `/students/${encodeURIComponent(meta.name)}${meta.school ? `?school=${encodeURIComponent(meta.school)}` : ""}`,
      { state: { list: siblings, index: index + step } }
    );
  };

  if (loading) return <p style={{ textAlign: "center" }}>Loading…</p>;
  if (error) return <p style={{ textAlign: "center", color: "crimson" }}>Error: {error}</p>;
  if (!current) return <p style={{ textAlign: "center" }}>Not found.</p>;

  return (
    <section style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ position: "relative", background: "#dfe9ee", padding: 18, borderRadius: 12 }}>
        {/* Prev / Next（有上下文时才显示） */}
        {prevMeta && (
          <button
            onClick={() => goSibling(prevMeta, -1)}
            style={{ position: "absolute", top: 12, left: 12 }}
          >
            &lt;
          </button>
        )}
        {nextMeta && (
          <button
            onClick={() => goSibling(nextMeta, +1)}
            style={{ position: "absolute", top: 12, right: 12 }}
          >
            &gt;
          </button>
        )}

        {/* 内容 */}
        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 16 }}>
          <img
            src={current.portraitUrl}
            alt={current.name}
            style={{ width: 160, height: 220, objectFit: "cover", borderRadius: 8 }}
            onError={(e:any)=>e.currentTarget.style.display='none'}
          />
          <div>
            <h2 style={{ margin: 0, color: "#c1438a" }}>{current.name}</h2>
            <div style={{ opacity: .8, marginBottom: 10 }}>
              School: {current.school || "-"}{" "}
              {current.schoolImageUrl && (
                <img
                  src={current.schoolImageUrl}
                  alt={current.school}
                  style={{ height: 18, marginLeft: 6 }}
                  onError={(e:any)=>e.currentTarget.style.display='none'}
                />
              )}
            </div>
            <p>Damage: <b>{current.damageType || "-"}</b></p>
            {current.birthday && <p>Birthday: {current.birthday}</p>}
            
          </div>
        </div>
      </div>
    </section>
  );
}
