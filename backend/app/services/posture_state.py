class PostureSessionState:
    def __init__(self):

        
        # 1. 직전 프레임의 EMA Score (다음 프레임의 EMA 계산에 필요)
        self.previous_ema_score: float = None 
        
        # 2. 자세 이탈이 시작된 시각 (ms 단위, 지속 시간 계산용)
        self.deviation_start_time_ms: int = None 
        
        # 3. 현재 진행 중인 이탈 구간의 DB ID (백엔드 저장용)
        self.current_segment_id: int = None 
        
        # 4. 현재 이탈 구간에서 이미 발생한 경고 단계 (1, 2, 3단계 중복 발생 방지)
        self.triggered_warning_levels: set = set() 
        
        # 5. 마지막으로 처리한 프레임의 시각 (시각 동기화용)
        self.last_timestamp_ms: int = None

        # 6. 현재 이탈 구간에서 관측된 최고 EMA Score
        # deviation_segments.max_ema_score 계산에 사용
        self.deviation_max_ema_score: float = None

        # 7. 현재 이탈 구간의 EMA Score 누적합
        # deviation_segments.avg_ema_score 계산에 사용
        self.deviation_ema_sum: float = 0.0

        # 8. 현재 이탈 구간 동안 분석된 프레임 수
        # avg_ema_score = deviation_ema_sum / deviation_frame_count 계산에 사용
        self.deviation_frame_count: int = 0
    
    # 세션별 상태 저장소
_state_store: dict[int, PostureSessionState] = {}


def get_state(session_id: int) -> PostureSessionState:
    """세션 상태 조회 — 없으면 새로 생성"""
    if session_id not in _state_store:
        _state_store[session_id] = PostureSessionState()
    return _state_store[session_id]


def remove_state(session_id: int) -> None:
    """WS 연결 종료 시 세션 상태 제거"""
    _state_store.pop(session_id, None)