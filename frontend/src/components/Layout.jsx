import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";

function Layout() {
  const navigate = useNavigate();

  // sessionStorage 값을 state로 관리해서 캘리브레이션 완료 시 즉시 반영 ✅
  const [isCalibrated, setIsCalibrated] = useState(sessionStorage.getItem("isCalibrated") === "true");

  useEffect(() => {
    const handleStorage = () => {
      setIsCalibrated(sessionStorage.getItem("isCalibrated") === "true");
    };

    window.addEventListener("storage", handleStorage);

    // sessionStorage는 같은 탭에서 storage 이벤트가 안 터지므로 폴링으로 보완
    const interval = setInterval(handleStorage, 1000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "#FFFFFF",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "15px 30px",
          borderBottom: "1px solid #F3F4F6",
          height: "70px",
          boxSizing: "border-box",
        }}
      >
        <h1 style={{ color: "#2563EB", fontSize: "20px", fontWeight: "900", margin: 0 }}>VISUAL POSTURE MANAGER</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: isCalibrated ? "#22C55E" : "#EF4444",
                display: "inline-block",
              }}
            ></span>
            <span style={{ fontSize: "15px", fontWeight: "900", color: "#CBD5E1", letterSpacing: "0.5px" }}>
              {isCalibrated ? "AI VISION ACTIVE" : "AI VISION READY"}
            </span>
          </div>

          <button
            onClick={() => navigate("/report")}
            style={{
              backgroundColor: "#F8FAFC",
              border: "none",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "bold",
              color: "#64748B",
              cursor: "pointer",
            }}
          >
            통계 보기
          </button>
        </div>
      </header>

      <div
        style={{
          display: "flex",
          flex: 1,
          padding: "10px",
          gap: "20px",
          backgroundColor: "#FAFAFA",
          overflow: "hidden",
        }}
      >
        <Sidebar />

        <main
          style={{
            flex: 1,
            height: "100%",
            backgroundColor: "white",
            borderRadius: "16px",
            border: "1px solid #F3F4F6",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
