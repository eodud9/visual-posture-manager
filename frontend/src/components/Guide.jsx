import { useNavigate } from 'react-router-dom';
import goodPostureImg from '../assets/good-posture.png';
import badPostureImg from '../assets/bad-posture.png';

function Guide() {
  const navigate = useNavigate();

  const goToWorkspace = () => {
    navigate('/workspace');
  };

  const cardStyle = {
    flex: 1, backgroundColor: 'white', borderRadius: '12px', padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6',
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'left'
  };

  const pointStyle = { fontSize: '13px', color: '#6B7280', margin: '5px 0' };

  return (
    <div style={{ padding: '16px' }}>
      <h1 className="font-bold text-2xl my-2">사용 가이드</h1>
      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '25px' }}>
      자세 가이드 확인 → 카메라 권한 허용 → 뽀모도로 세션 시간 설정 → 집중 시작 → Floating Mode 실행 후 작업 진행 
      </p>

      {/* 가이드 카드 영역 (Good/Bad 예시) */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        {/* 바른 자세  */}
        <div style={{ ...cardStyle, borderTop: '4px solid #10B981' }}>
          <div style={{ color: '#10B981', fontWeight: 'bold', fontSize: '15px', marginBottom: '15px', alignSelf: 'flex-start' }}>
            ● 바른 자세
          </div>
          <div style={{ width: '100%', height: '180px', backgroundColor: '#ECFDF5', borderRadius: '8px', marginBottom: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#10B981', fontSize: '12px' }}>
            <img
              src={goodPostureImg}
              alt="바른 자세"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>
          <div style={{ alignSelf: 'flex-start' }}>
            <p style={pointStyle}>• 귀 - 어깨 수직 정렬</p>
            <p style={pointStyle}>• 허리 직립 • 팔꿈치 90°</p>
          </div>
        </div>
        {/* 안좋은 자세*/}
        <div style={{ ...cardStyle, borderTop: '4px solid #EF4444' }}>
          <div style={{ color: '#EF4444', fontWeight: 'bold', fontSize: '15px', marginBottom: '15px', alignSelf: 'flex-start' }}>
            ● 안좋은 자세
          </div>
          <div style={{ width: '100%', height: '180px', backgroundColor: '#FEF2F2', borderRadius: '8px', marginBottom: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#EF4444', fontSize: '12px' }}>
              <img
                src={badPostureImg}
                alt="안좋은 자세"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
          </div>
          <div style={{ alignSelf: 'flex-start' }}>
            <p style={pointStyle}>• 거북목 • 굽은 등</p>
            <p style={pointStyle}>• 어깨 비대칭 • 고개 숙임</p>
          </div>
        </div>
      </div>

      {/* 하단 이동 버튼 */}
      <button 
        onClick={goToWorkspace}
        style={{
          backgroundColor: '#2563EB', color: 'white', border: 'none', padding: '12px 0',
          fontSize: '16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
          width: '100%' // 전체 너비
        }}
      >
        가이드 확인 완료
      </button>
    </div>
  );
}

export default Guide;