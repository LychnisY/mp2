// src/views/GalleryView.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Student } from "../types";
import { SCHOOL_ORDER } from "../constants";
import { fetchSchoolPage, fetchStudentsPage } from "../api";

const PER_PAGE = 24;

export default function GalleryView() {
  const [school, setSchool] = useState<string>("All");

  const [items, setItems] = useState<Student[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 切换学校：重置并拉第一页
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = school === "All"
          ? await fetchStudentsPage(1, PER_PAGE)
          : await fetchSchoolPage(school, 1, PER_PAGE);

        if (cancelled) return;
        setItems(res.items);
        setTotal(res.total);
        setPage(1);
        setHasMore(res.hasMore);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Failed to load");
          setHasMore(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [school]);

  // 触底加载下一页
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || loading || error || !hasMore) return;

    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      (async () => {
        if (loading) return;
        setLoading(true);
        try {
          const next = page + 1;
          const res = school === "All"
            ? await fetchStudentsPage(next, PER_PAGE)
            : await fetchSchoolPage(school, next, PER_PAGE);

          setItems(prev => {
            const seen = new Set(prev.map(x => x.id || x.name));
            const merged = prev.concat(res.items.filter(x => !seen.has(x.id || x.name)));
            return merged;
          });
          setPage(next);
          setHasMore(res.hasMore);
          // total 只有全库分页可靠；按学校就保持 undefined
          if (typeof res.total === "number") setTotal(res.total);
        } catch (e: any) {
          const status = e?.response?.status;
          // 对 400/404 直接停止继续加载，避免无限重试
          if (status === 400 || status === 404) {
            setHasMore(false);
          }
          setError(e?.message ?? "Failed to load more");
        } finally {
          setLoading(false);
        }
      })();
    }, { rootMargin: "200px" });

    io.observe(el);
    return () => io.disconnect();
  }, [page, school, hasMore, loading, error]);

  const schools = useMemo(() => ["All", ...SCHOOL_ORDER], []);

  return (
    <section style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 16 }}>
        {schools.map(sc => (
          <FilterButton key={sc} active={school === sc} onClick={() => setSchool(sc)}>{sc}</FilterButton>
        ))}
      </div>

      <div style={{ textAlign: "center", opacity: .7, marginBottom: 8 }}>
        {error
          ? <span style={{ color: "crimson" }}>Error: {error}</span>
          : <span>
              {items.length}{typeof total === "number" ? ` / ${total}` : ""}{loading && " · loading…"}
            </span>}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: 14
      }}>
        {items.map(s => (
          <Link key={`${s.id}-${s.name}`}
                to={{ pathname: `/students/${encodeURIComponent(s.name)}`, search: s.school ? `?school=${encodeURIComponent(s.school)}` : "" }}
                state={{ student: s, list: items }}
                style={{ display: "block", background: "#f3f6f9", borderRadius: 10, padding: 8, textAlign: "center" }}>
            <img src={s.portraitUrl} alt={s.name}
                 style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 8 }}
                 onError={(e: any) => e.currentTarget.style.display = "none"} />
            <div style={{ marginTop: 8, fontWeight: 600 }}>{s.name}</div>
            <div style={{ fontSize: 12, opacity: .7 }}>{s.school}</div>
          </Link>
        ))}
      </div>

      {/* 触底哨兵 */}
      <div ref={sentinelRef} style={{ height: 1 }} />

      {!loading && !error && !hasMore && (
        <p style={{ textAlign: "center", opacity: .6, marginTop: 12 }}>No more.</p>
      )}
    </section>
  );
}

function FilterButton(props: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={props.onClick}
      style={{
        padding: "8px 14px",
        borderRadius: 8,
        border: "none",
        background: props.active ? "#0b7897" : "#0f9ab8",
        color: "white",
        cursor: "pointer"
      }}>
      {props.children}
    </button>
  );
}
