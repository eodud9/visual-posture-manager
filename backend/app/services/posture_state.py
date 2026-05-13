class PostureSessionState:
    def __init__(self):
        # 1. 직전 프레임의 EMA Score (다음 프레임의 EMA 계산에 필요) [cite: 1313, 1318]
        self.previous_ema_score: float = None 
        
        # 2. 자세 이탈이 시작된 시각 (ms 단위, 지속 시간 계산용) [cite: 1314, 1318]
        self.deviation_start_time_ms: int = None 
        
        # 3. 현재 진행 중인 이탈 구간의 DB ID (백엔드 저장용) [cite: 1315, 1318]
        self.current_segment_id: int = None 
        
        # 4. 현재 이탈 구간에서 이미 발생한 경고 단계 (1, 2, 3단계 중복 발생 방지) [cite: 1316, 1318]
        self.triggered_warning_levels: set = set() 
        
        # 5. 마지막으로 처리한 프레임의 시각 (시각 동기화용) [cite: 1317, 1318]
        self.last_timestamp_ms: int = None