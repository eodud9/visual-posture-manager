import { useNavigate } from "react-router-dom";

function Report() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
        }}
      >
        <h1 className="font-bold text-2xl my-2">통계 보기</h1>

        <button
          onClick={() => navigate("/workspace")}
          style={{
            backgroundColor: "#2563EB",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Workspace로 가기
        </button>
      </div>

      <p style={{ fontSize: "14px", color: "#6B7280" }}>통계화면</p>
    </div>
  );
}

export default Report;
