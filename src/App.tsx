import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import SearchView from "./views/SearchView";
import GalleryView from "./views/GalleryView";
import DetailView from "./views/DetailView";

export default function App() {
  return (
    <div
      className="min-h-screen px-6 py-8"
      style={{
        position: "relative",
        fontFamily: "Inter, system-ui",
        overflow: "hidden",
      }}
    >

      <img
        src={`${process.env.PUBLIC_URL}/search_bg.jpg`} // public 下的图片
        alt=""
        aria-hidden
        style={{
          position: "fixed", 
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "blur(18px) brightness(0.9) saturate(1.05)",
          transform: "scale(1.08)",
          zIndex: 0,
          pointerEvents: "none", 
        }}
      />

      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.4) 40%, rgba(255,255,255,0.3) 100%)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 2 }}>
        <h1
          style={{
            fontSize: 36,
            textAlign: "center",
            marginBottom: 8,
            color: "#222",
          }}
        >
          Blue Archive Directory
        </h1>

        <nav
          style={{
            display: "flex",
            gap: 24,
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <NavLink to="/search">Search</NavLink>
          <NavLink to="/gallery">Gallery</NavLink>
        </nav>

        <Routes>
          <Route path="/" element={<SearchView />} />
          <Route path="/search" element={<SearchView />} />
          <Route path="/gallery" element={<GalleryView />} />
          <Route path="/students/:name" element={<DetailView />} />
          <Route path="*" element={<NoMatch />} />
        </Routes>
      </div>
    </div>
  );
}

function NoMatch() {
  const nav = useNavigate();
  return (
    <div style={{ textAlign: "center" }}>
      <p>Not Found</p>
      <button onClick={() => nav("/search")}>Back to Search</button>
    </div>
  );
}