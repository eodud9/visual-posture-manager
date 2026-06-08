import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const [isChecked, setIsChecked] = useState(false);
  const [showError, setShowError] = useState(false);
  const navigate = useNavigate();

  const handleStart = () => {
    if (isChecked) {
      navigate("/workspace");
    } else {
      setShowError(true);
    }
  };

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      {/* slim top bar */}
      <div style={{ height: "var(--header-h)", display: "flex", alignItems: "center", gap: 9, padding: "0 26px" }}>
        <span style={{ fontWeight: 700, fontSize: 25, letterSpacing: "-0.02em", color: "#3B5BDB" }}>
          Visual Posture Manager
        </span>
      </div>

      {/* centered card */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 24px 60px",
        }}
      >
        <div
          style={{
            width: 520,
            maxWidth: "100%",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-xl)",
            boxShadow: "var(--sh-md)",
            padding: "40px 40px 32px",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", color: "#3B5BDB" }}>
            Visual Posture Manager
          </h1>
          <p style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.65, color: "var(--text-2)" }}>
            웹캠으로 작업 중인 상체 자세를 실시간으로 인식하고, 기준 자세 대비 이탈을 감지하는 집중 관리 서비스입니다.
          </p>

          {/* privacy notice */}
          <div
            style={{
              marginTop: 26,
              padding: "18px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
              <span style={{ color: "var(--green)", display: "flex" }}>
                <ShieldIcon />
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>
                개인정보 보호 및 데이터 사용 안내
              </span>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
              {[
                "자세 모니터링을 위해 웹캠 영상을 실시간으로 활용합니다.",
                "모든 영상은 기기 내(로컬)에서만 분석되며 서버로 전송·저장되지 않습니다.",
              ].map((t, i) => (
                <li key={i} style={{ display: "flex", gap: 9, fontSize: 13, lineHeight: 1.5, color: "var(--text-2)" }}>
                  <span style={{ color: "var(--green)", marginTop: 1, flexShrink: 0, display: "flex" }}>
                    <CheckIcon />
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* consent */}
          <label
            style={{
              marginTop: 22,
              display: "flex",
              alignItems: "center",
              gap: 11,
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => {
                setIsChecked(e.target.checked);
                if (e.target.checked) setShowError(false);
              }}
              style={{
                width: 18,
                height: 18,
                accentColor: "#3b5bdb",
                cursor: "pointer",
                flexShrink: 0,
                border: "none",
              }}
            />
            <span
              style={{
                fontSize: 14,
                fontWeight: isChecked ? 600 : 500,
                color: isChecked ? "var(--text)" : "var(--text-2)",
              }}
            >
              웹캠 사용 및 안내사항에 동의합니다.
            </span>
          </label>

          {showError && (
            <p
              style={{
                margin: "12px 0 0",
                fontSize: 12.5,
                color: "var(--red)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <AlertIcon /> 동의 후 시작할 수 있습니다.
            </p>
          )}

          <button
            onClick={handleStart}
            disabled={!isChecked}
            style={{
              marginTop: 24,
              width: "100%",
              height: 50,
              background: isChecked ? "var(--brand)" : "#d6d9e0",
              color: "#fff",
              border: "none",
              borderRadius: "var(--r-md)",
              fontSize: 15,
              fontWeight: 600,
              cursor: isChecked ? "pointer" : "not-allowed",
              transition: "background 0.15s",
              boxShadow: isChecked ? "0 1px 1px rgba(20,28,46,0.12), inset 0 1px 0 rgba(255,255,255,0.12)" : "none",
            }}
            onMouseEnter={(e) => {
              if (isChecked) e.currentTarget.style.background = "var(--brand-hover)";
            }}
            onMouseLeave={(e) => {
              if (isChecked) e.currentTarget.style.background = "var(--brand)";
            }}
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
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

function ShieldIcon() {
  return (
    <svg
      width={17}
      height={17}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l9.5 16.5H2.5z" />
      <line x1="12" y1="10" x2="12" y2="14" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" />
    </svg>
  );
}

export default Home;
