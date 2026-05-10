import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [isChecked, setIsChecked] = useState(false);
  const navigate = useNavigate();

  const handleStart = () => {
    if (isChecked) {
      navigate('/guide');
    } else {
      alert('웹캠 사용 및 안내사항에 동의해주세요!');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: 'white', padding: '50px 40px', borderRadius: '16px', width: '600px', color: '#1F2937', textAlign: 'center', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', border: '1px solid #F3F4F6' }}>
        <h1 style={{ color: '#2563EB', fontSize: '30px', fontWeight: '900', marginBottom: '15px', letterSpacing: '0.5px' }}>
          VISUAL POSTURE MANAGER
        </h1>
        <h2 style={{ fontSize: '14px', color: '#6B7280', fontWeight: 'normal', marginBottom: '15px' }}>
          웹캠 기반 노트북으로 작업하는 사용자의 상체 자세를 실시간으로 인식하고 <br></br>기준 자세 대비 이탈 여부를 감지하는 웹서비스입니다.
        </h2>
        <h2 style={{ fontSize: '16px', color: '#6B7280', fontWeight: 'normal', marginBottom: '10px' }}>
          서비스 이용을 위해 아래 사항을 확인해주세요
        </h2>
        
        <div style={{ fontSize: '13px', lineHeight: '1.8', color: '#4B5563', marginBottom: '35px', textAlign: 'left', backgroundColor: '#F9FAFB', padding: '20px', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#1F2937' }}>✅ 개인정보 보호 및 데이터 사용 안내</p>
          <p style={{ margin: 0 }}>
            • 본 서비스는 자세 모니터링을 위해 사용자의 웹캠 영상을 실시간으로 활용합니다.<br />
            • 실시간 인공지능 분석 목적으로만 로컬에서 처리됩니다.
          </p>
        </div>

        <div style={{ marginBottom: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <input type="checkbox" id="agree" checked={isChecked} onChange={(e) => setIsChecked(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#2563EB' }} />
          <label htmlFor="agree" style={{ fontSize: '15px', color: isChecked ? '#111827' : '#6B7280', cursor: 'pointer', fontWeight: isChecked ? 'bold' : 'normal' }}>
            웹캠 사용 및 안내사항에 동의합니다.
          </label>
        </div>

        <button onClick={handleStart} style={{ backgroundColor: isChecked ? '#2563EB' : '#D1D5DB', color: 'white', border: 'none', padding: '15px 0', fontSize: '16px', borderRadius: '10px', cursor: isChecked ? 'pointer' : 'not-allowed', fontWeight: 'bold', width: '100%', transition: 'background-color 0.2s' }}>
          시작하기
        </button>
      </div>
    </div>
  );
}

export default Home;