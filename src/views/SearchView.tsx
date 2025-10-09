import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Student } from "../types";
import { SortDir, SortKey, sortStudents } from "../sorters";
import { fetchByName, fetchStudentsPage } from "../api";

export default function SearchView() {
  const [items, setItems] = useState<Student[]>([]);  // 已加载的分页数据（累积）
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const perPage = 20;

  const [loadingPage, setLoadingPage] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [q, setQ] = useState("");
  const [remote, setRemote] = useState<Student[] | null>(null);
  const [loadingRemote, setLoadingRemote] = useState(false);

  const [key, setKey] = useState<SortKey>("name");
  const [dir, setDir] = useState<SortDir>("asc");

  // 初次拉第一页
  useEffect(() => {
    (async () => {
      setLoadingPage(true);
      try {
        const res = await fetchStudentsPage(1, perPage);
        setItems(res.items);
        const totalNum = typeof res.total === "number" ? res.total : res.items.length;
        setTotal(totalNum);
        setPage(1);
        setHasMore(res.hasMore ?? (res.items.length === perPage));
      } finally {
        setLoadingPage(false);
      }
    })();
  }, []);

  // 下拉到底：IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!hasMore || loadingPage || q.trim()) return; // 搜索时不翻页
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        (async () => {
          setLoadingPage(true);
          try {
            const next = page + 1;
            const res = await fetchStudentsPage(next, perPage);
            // 去重合并（以 id 或 name 为键）
            setItems(prev => {
              const seen = new Set(prev.map(x => x.id || x.name));
              const merged = prev.concat(res.items.filter(x => !seen.has(x.id || x.name)));
              return merged;
            });
            setPage(next);
            setHasMore(res.hasMore ?? (res.items.length === perPage));
            if (typeof res.total === "number") setTotal(res.total);
          } finally {
            setLoadingPage(false);
          }
        })();
      }
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadingPage, page, q]);

  // 远程搜索（防抖 300ms；长度<2 恢复分页列表）
  useEffect(() => {
    const s = q.trim();
    if (s.length < 2) { setRemote(null); return; }
    const t = setTimeout(async () => {
      setLoadingRemote(true);
      try {
        const list = await fetchByName(s);
        setRemote(list);
      } finally {
        setLoadingRemote(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  // 决定展示：有远程结果优先展示远程，否则展示已加载的分页数据
  const base = useMemo(() => sortStudents(items, key, dir), [items, key, dir]);
  const shown = useMemo(
    () => sortStudents(remote ?? base, key, dir),
    [remote, base, key, dir]
  );

return (
  <section
    style={{
      position: "relative",
      maxWidth: 900,
      margin: "0 auto",
      overflow: "hidden", // 防止模糊图外溢
      borderRadius: 12,
    }}
  >
    <div style={{ position: "relative", zIndex: 1, paddingBottom: 40 }}>
      <div
        style={{
          background: "rgba(231,239,243,0.9)",
          padding: 16,
          borderRadius: 8,
          marginBottom: 16,
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search students"
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 6,
            border: "1px solid #c9d6dc",
            marginBottom: 12,
            backgroundColor: "rgba(255,255,255,0.8)",
          }}
        />
        <label style={{ display: "block", marginBottom: 8 }}>Sort by:</label>
        <select
          value={key}
          onChange={(e) => setKey(e.target.value as SortKey)}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 6,
            border: "1px solid #c9d6dc",
            marginBottom: 12,
            backgroundColor: "rgba(255,255,255,0.8)",
          }}
        >
          <option value="name">Name</option>
          <option value="school">School</option>
          <option value="damage">Damage</option>
        </select>
        <div style={{ display: "flex", gap: 12 }}>
          <label>
            <input
              type="radio"
              checked={dir === "asc"}
              onChange={() => setDir("asc")}
            />{" "}
            ascending
          </label>
          <label>
            <input
              type="radio"
              checked={dir === "desc"}
              onChange={() => setDir("desc")}
            />{" "}
            descending
          </label>
        </div>
        <p style={{ opacity: 0.6, marginTop: 8 }}>
          total: {remote ? shown.length : `${items.length}/${total}`}
          {loadingRemote && ` · searching "${q}"…`}
          {loadingPage && " · loading more…"}
        </p>
      </div>

      {/* 列表 */}
      <ul style={{ display: "grid", gap: 12 }}>
        {shown.map((s) => (
          <li
            key={`${s.id}-${s.name}`}
            style={{
              background: "rgba(246,247,249,0.95)",
              padding: 12,
              borderRadius: 8,
              display: "flex",
              gap: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <img
              src={s.portraitUrl}
              alt={s.name}
              style={{
                width: 60,
                height: 60,
                objectFit: "cover",
                borderRadius: 8,
              }}
              onError={(e: any) => (e.currentTarget.style.display = "none")}
            />
            <div style={{ flex: 1 }}>
              <Link
                to={{
                  pathname: `/students/${encodeURIComponent(s.name)}`,
                  search: s.school
                    ? `?school=${encodeURIComponent(s.school)}`
                    : "",
                }}
                state={s}
                style={{
                  fontSize: 20,
                  color: "#c1438a",
                  textDecoration: "none",
                }}
              >
                {s.name}
              </Link>
              <p style={{ opacity: 0.7, fontSize: 14 }}>
                {s.school} · {s.damageType}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* 底部哨兵 + 兜底按钮 */}
      {!remote && <div ref={sentinelRef} style={{ height: 1 }} />}
      {!remote && hasMore && !loadingPage && (
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <button
            onClick={() => {
              /* 兜底点击加载 */
            }}
            style={{ display: "none" }}
          />
        </div>
      )}
      {!remote && !hasMore && (
        <p style={{ textAlign: "center", opacity: 0.6, marginTop: 12 }}>
          No more.
        </p>
      )}
    </div>
  </section>
);

}