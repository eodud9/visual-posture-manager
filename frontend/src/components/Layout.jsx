import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isCalibrated = sessionStorage.getItem('isCalibrated') === 'true';

return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      backgroundColor: '#FFFFFF',
      overflow: 'hidden'
    }}>
      
      <header style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '15px 30px', borderBottom: '1px solid #F3F4F6',
        height: '70px', boxSizing: 'border-box' // 헤더 높이 명시
      }}>
        <h1 style={{ color: '#2563EB', fontSize: '20px', fontWeight: '900', margin: 0 }}>
          VISUAL POSTURE MANAGER
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              width: '12px', height: '12px', borderRadius: '50%', 
              backgroundColor: isCalibrated ? '#22C55E' : '#EF4444',
              display: 'inline-block' 
            }}></span>
            <span style={{ fontSize: '15px', fontWeight: '900', color: '#CBD5E1', letterSpacing: '0.5px' }}>
              {isCalibrated ? 'AI VISION ACTIVE' : 'AI VISION READY'}
            </span>
          </div>
          
          <button 
            onClick={() => navigate('/report')}
            style={{ 
              backgroundColor: '#F8FAFC', border: 'none', padding: '8px 16px', 
              borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', color: '#64748B', cursor: 'pointer' 
            }}>
            통계 보기
          </button>
        </div>
      </header>

      {/* 메인 영역 (사이드바 + 컨텐츠) */}
      <div style={{ 
        display: 'flex', 
        flex: 1, // 남은 높이 전체 차지
        padding: '10px', // 패딩을 조금 줄여서 공간 확보
        gap: '20px', 
        backgroundColor: '#FAFAFA',
        overflow: 'hidden' // 내부 요소가 삐져나가지 않게 함
      }}>
        
        <Sidebar />

        <main style={{ 
          flex: 1, 
          height: '100%', 
          backgroundColor: 'white', 
          borderRadius: '16px',
          border: '1px solid #F3F4F6',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <Outlet />
        </main>

      </div>
    </div>
  );
}

export default Layout;