import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isCalibrated, setIsCalibrated] = useState(sessionStorage.getItem("isCalibrated") === "true");

  useEffect(() => {
    const handleStorage = () => {
      setIsCalibrated(sessionStorage.getItem("isCalibrated") === "true");
    };

    window.addEventListener("storage", handleStorage);
    const interval = setInterval(handleStorage, 1000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  const route = location.pathname === "/report" ? "report" : "workspace";

  return (
    <div
      style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg)", overflow: "hidden" }}
    >
      {/* header */}
      <header
        style={{
          height: "var(--header-h)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 22px",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* logo */}

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="font-bold text-blue-700 text-xl">Visual Posture Manager</span>
        </div>

        {/* right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* AI VISION pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "5px 11px 5px 9px",
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 600,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: isCalibrated ? "var(--green)" : "var(--text-3)",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                position: "relative",
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: isCalibrated ? "var(--green)" : "var(--text-4)",
                flexShrink: 0,
              }}
              className={isCalibrated ? "vpm-dot-live" : ""}
            />
            {isCalibrated ? "AI VISION ACTIVE" : "AI VISION READY"}
          </div>

          {/* segmented nav */}
          <nav
            style={{
              display: "flex",
              gap: 2,
              background: "var(--surface-2)",
              padding: 3,
              borderRadius: 10,
              border: "1px solid var(--border)",
            }}
          >
            <SegBtn active={route === "workspace"} onClick={() => navigate("/workspace")} icon="clock">
              세션
            </SegBtn>
            <SegBtn active={route === "report"} onClick={() => navigate("/report")} icon="chart">
              리포트
            </SegBtn>
          </nav>
        </div>
      </header>

      {/* body */}
      <div style={{ flex: 1, display: "flex", gap: 16, padding: 16, minHeight: 0, overflow: "hidden" }}>
        <Sidebar />
        <main
          style={{
            flex: 1,
            minWidth: 0,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            boxShadow: "var(--sh-sm)",
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SegBtn({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        height: 30,
        padding: "0 12px",
        borderRadius: 7,
        border: "none",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
        whiteSpace: "nowrap",
        background: active ? "var(--surface)" : "transparent",
        color: active ? "var(--brand)" : "var(--text-3)",
        boxShadow: active ? "var(--sh-xs)" : "none",
        transition: "all 0.15s",
      }}
    >
      {icon === "clock" ? <ClockIcon /> : <ChartIcon />}
      {children}
    </button>
  );
}

function LogoIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="3" width="18" height="18" rx="5" opacity="0.18" />
      <circle cx="12" cy="9.2" r="2.7" />
      <path
        d="M6.5 18.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="20" x2="20" y2="20" />
      <rect x="5.5" y="12" width="3" height="6" rx="1" />
      <rect x="10.5" y="8" width="3" height="10" rx="1" />
      <rect x="15.5" y="4" width="3" height="14" rx="1" />
    </svg>
  );
}

export default Layout;
