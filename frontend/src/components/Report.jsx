import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getSessionReport } from "../api/sessions";

const TIMELINE_SLOTS = 30;

function formatMs(ms) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

function buildTimeline(segments, totalMs, sessionStartMs) {
  if (totalMs <= 0) return Array(TIMELINE_SLOTS).fill(false);
  const slotMs = totalMs / TIMELINE_SLOTS;
  return Array.from({ length: TIMELINE_SLOTS }, (_, i) => {
    const slotStart = i * slotMs;
    const slotEnd = (i + 1) * slotMs;
    return segments.some((seg) => {
      const relStart = seg.startTimeMs - sessionStartMs;
      const relEnd = seg.endTimeMs - sessionStartMs;
      return relStart < slotEnd && relEnd > slotStart;
    });
  });
}

function buildHistogram(segments, totalMs, sessionStartMs) {
  const maxMinute = Math.max(1, Math.ceil(totalMs / 60000));
  const counts = Array(maxMinute).fill(0);
  segments.forEach((seg) => {
    const m = Math.floor((seg.startTimeMs - sessionStartMs) / 60000);
    if (m >= 0 && m < maxMinute) counts[m]++;
  });
  return counts.map((count, i) => ({ minute: i + 1, count }));
}

function getPeakInsight(histData) {
  if (!histData.length) return null;
  const peak = histData.reduce((a, b) => (b.count > a.count ? b : a));
  if (peak.count === 0) return "세션 동안 자세 이탈이 없었습니다. 훌륭한 집중이었어요!";
  return `약 ${peak.minute - 1}분~${peak.minute}분 구간에서 이탈이 가장 잦았습니다. 이 시간대에 짧은 스트레칭을 권장합니다.`;
}

export default function Report() {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionId = location.state?.sessionId;

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    getSessionReport(sessionId)
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch((e) => {
        setLoading(false);
      });
  }, [sessionId]);

  if (loading) {
    return (
      <div
        style={{
          padding: 32,
          textAlign: "center",
          color: "var(--text-3)",
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        리포트 불러오는 중...
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <p style={{ color: "var(--text-3)", fontSize: 14, textAlign: "center" }}>리포트 데이터를 불러올 수 없습니다.</p>
        <button
          onClick={() => navigate("/workspace")}
          style={{
            height: 50,
            padding: "0 24px",
            background: "var(--brand)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--r-md)",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          새 세션 시작
        </button>
      </div>
    );
  }

  const { totalSessionMs, deviationCount, segments, sessionStartMs } = report;
  const deviationMs = segments.reduce((acc, s) => acc + (s.endTimeMs - s.startTimeMs), 0);
  const goodRatio = totalSessionMs > 0 ? Math.round(((totalSessionMs - deviationMs) / totalSessionMs) * 100) : 100;

  const timeline = buildTimeline(segments, totalSessionMs, sessionStartMs); // ← sessionStartMs 추가
  const histData = buildHistogram(segments, totalSessionMs, sessionStartMs); // ← sessionStartMs 추가

  const paddedHistData = histData.length < 2 ? [...histData, { minute: histData.length + 1, count: 0 }] : histData;

  const insight = getPeakInsight(histData);
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });

  return (
    <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* header row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-3)",
            }}
          >
            Session Report
          </span>
          <h1
            style={{
              margin: "6px 0 0",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.025em",
              color: "var(--text)",
            }}
          >
            세션 리포트
          </h1>
          <p
            style={{
              margin: "5px 0 0",
              fontSize: 13,
              color: "var(--text-3)",
              whiteSpace: "nowrap",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {today} · 집중 세션 {formatMs(totalSessionMs)}
          </p>
        </div>

        <button
          onClick={() => navigate("/workspace")}
          style={{
            height: 44,
            padding: "0 18px",
            background: "var(--brand)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--r-md)",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            whiteSpace: "nowrap",
            fontFamily: "inherit",
            boxShadow: "0 1px 1px rgba(20,28,46,0.12), inset 0 1px 0 rgba(255,255,255,0.12)",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--brand-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--brand)";
          }}
        >
          <PlayIcon /> 새 세션 시작
        </button>
      </div>

      {/* KPI row — 3 cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <KpiCard
          icon={<ClockIcon />}
          iconBg="var(--brand-soft)"
          iconColor="var(--brand)"
          label="총 세션 시간"
          value={formatMs(totalSessionMs)}
          sub="집중 세션 완료"
        />
        <KpiCard
          icon={<ShieldIcon />}
          iconBg="var(--green-soft)"
          iconColor="var(--green)"
          label="바른 자세 유지율"
          value={`${goodRatio}%`}
          sub={`이탈 시간 ${formatMs(deviationMs)}`}
          bar={goodRatio}
          barColor="var(--green)"
        />
        <KpiCard
          icon={<AlertIcon />}
          iconBg="var(--red-soft)"
          iconColor="var(--red)"
          label="총 이탈 횟수"
          value={`${deviationCount}회`}
          sub={deviationCount === 0 ? "이탈 없음" : "평균 5분마다 1회"}
        />
      </div>

      {/* timeline */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--sh-sm)",
          padding: "18px 20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap" }}>
            자세 이탈 구간
          </span>
          <div style={{ display: "flex", gap: 16 }}>
            <LegendItem color="var(--brand-soft)" label="바른 자세" hasBorder />
            <LegendItem color="var(--red)" label="이탈" />
          </div>
        </div>
        <div style={{ display: "flex", gap: 2, height: 36, borderRadius: 4, overflow: "hidden" }}>
          {timeline.map((isDev, i) => (
            <div
              key={i}
              title={isDev ? "이탈 구간" : "바른 자세"}
              style={{
                flex: 1,
                borderRadius: 3,
                background: isDev ? "var(--red)" : "var(--brand-soft)",
                opacity: isDev ? 0.9 : 1,
              }}
            />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
            fontSize: 11.5,
            color: "var(--text-3)",
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span>0:00</span>
          <span>{formatMs(totalSessionMs)}</span>
        </div>
      </div>

      {/* histogram + insight */}
      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 14, alignItems: "stretch" }}>
        {/* histogram */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            boxShadow: "var(--sh-sm)",
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 16,
              whiteSpace: "nowrap",
            }}
          >
            시간대별 이탈 분포
          </span>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140, padding: "0 4px" }}>
            {paddedHistData.map((entry, i) => {
              const maxCount = Math.max(...paddedHistData.map((d) => d.count), 1);
              const heightPct = entry.count === 0 ? 4 : (entry.count / maxCount) * 100;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    height: "100%",
                  }}
                >
                  <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                    <div
                      style={{
                        width: "100%",
                        height: `${heightPct}%`,
                        background: entry.count >= 2 ? "#ef4444" : entry.count === 1 ? "#2563eb" : "#e2e5eb",
                        borderRadius: "4px 4px 2px 2px",
                        minHeight: 4,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 10, color: "#8b93a3" }}>{entry.minute}m</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* insight card */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            boxShadow: "var(--sh-sm)",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "var(--amber-soft)",
              color: "var(--amber)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SparkIcon />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text)" }}>이탈 집중 구간</p>
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 13,
                lineHeight: 1.6,
                color: "var(--text-2)",
              }}
            >
              {insight}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, iconBg, iconColor, label, value, sub, bar, barColor }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--sh-sm)",
        padding: "18px 20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: iconBg,
            color: iconColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", whiteSpace: "nowrap" }}>{label}</span>
      </div>
      <div
        style={{
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          color: "var(--text)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      {bar != null && (
        <div
          style={{
            height: 5,
            borderRadius: 99,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            overflow: "hidden",
            margin: "12px 0 8px",
          }}
        >
          <div
            style={{
              width: `${bar}%`,
              height: "100%",
              background: barColor,
              borderRadius: 99,
            }}
          />
        </div>
      )}
      <div
        style={{
          fontSize: 12,
          color: "var(--text-3)",
          marginTop: bar != null ? 0 : 8,
          whiteSpace: "nowrap",
        }}
      >
        {sub}
      </div>
    </div>
  );
}

function LegendItem({ color, label, hasBorder }) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        color: "var(--text-3)",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 11,
          height: 11,
          borderRadius: 3,
          background: color,
          border: hasBorder ? "1px solid var(--border-strong)" : "none",
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}

function ClockIcon() {
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
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
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

function AlertIcon() {
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
      <path d="M12 3l9.5 16.5H2.5z" />
      <line x1="12" y1="10" x2="12" y2="14" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      width={19}
      height={19}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
    </svg>
  );
}
