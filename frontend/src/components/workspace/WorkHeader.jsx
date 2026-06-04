export const WorkHeader = () => {
  return (
    <div style={{ marginBottom: 4 }}>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)" }}>
        집중 세션 타이머
      </h1>
      <p style={{ margin: "5px 0 0", fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.5 }}>
        세션을 시작하면 캘리브레이션을 거쳐 실시간 자세 분석이 시작됩니다. 미니 화면으로 작업 중에도 시간을 확인하세요.
      </p>
    </div>
  );
};
