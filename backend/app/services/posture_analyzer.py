# app/services/posture_analyzer.py
import numpy as np

def extract_features(landmarks):
    """랜드마크 좌표에서 자세 특징량(zRatio, neckTilt, bodySlope) 계산"""
    # 설계서 규격에 맞게 리스트를 딕셔너리로 변환 (id 기반 접근) [cite: 1130]
    lm = {item['id']: item for item in landmarks}
    
    # 7, 8(귀), 11, 12(어깨) 번 필수 랜드마크 추출 [cite: 1298]
    l_ear, r_ear = lm[7], lm[8]
    l_sh, r_sh = lm[11], lm[12]

    # 가시성(visibility) 체크: 기준 미만이면 분석 제외 
    for i in [7, 8, 11, 12]:
        if lm[i].get('visibility', 1.0) < 0.5:
            return None

    # 어깨너비(sh_w)를 기준 단위로 정규화 [cite: 374, 407]
    sh_w = np.sqrt((l_sh['x'] - r_sh['x'])**2 + (l_sh['y'] - r_sh['y'])**2) + 1e-6
    if sh_w < 0.05: return None # 어깨너비가 너무 작으면 계산 불가 [cite: 1300]
    
    # 특징량 계산 로직 (가중치 포함) [cite: 404, 405, 406]
    z_ratio = (((l_sh['z'] + r_sh['z'])/2) - ((l_ear['z'] + r_ear['z'])/2)) / sh_w * 6.0
    neck_tilt = ((l_ear['y'] - l_sh['y']) - (r_ear['y'] - r_sh['y'])) / sh_w * 2.0
    body_slope = (l_sh['y'] - r_sh['y']) / sh_w * 2.5
    
    return {"zRatio": z_ratio, "neckTilt": neck_tilt, "bodySlope": body_slope}

def calculate_mahalanobis(features, calibration):
    """캘리브레이션 기준값 대비 현재 자세의 마할라노비스 거리(MD Score) 계산""" 
    feat_vec = np.array([features['zRatio'], features['neckTilt'], features['bodySlope']])
    mu = np.array(calibration.feature_median)
    
    # 공분산 행렬 역행렬 계산 (Ridge Adjustment 및 pseudo-inverse 적용) [cite: 420, 421, 1303]
    S = np.array(calibration.covariance_matrix) + np.eye(3) * 0.01
    inv_S = np.linalg.pinv(S)
    
    delta = feat_vec - mu
    md_score = np.sqrt(np.dot(np.dot(delta, inv_S), delta.T))
    return float(md_score)

def analyze_posture(landmarks, calibration, state, timestamp_ms):
    """전체 분석 흐름 통합 및 경고 단계 판단""" 
    # 1. 특징량 추출
    features = extract_features(landmarks)
    if not features:
        return None # 가시성 낮거나 데이터 부족 시 분석 건너뜀 [cite: 1299]

    # 2. MD Score 계산
    md_score = calculate_mahalanobis(features, calibration)
    
    # 3. EMA 필터 적용 (순간 흔들림 억제) [cite: 418, 1232]
    prev_ema = state.previous_ema_score if state.previous_ema_score is not None else md_score
    ema_score = (calibration.alpha * md_score) + (1 - calibration.alpha) * prev_ema
    state.previous_ema_score = ema_score # 상태 업데이트 [cite: 1320]
    
    # 4. 자세 이탈 판단
    is_outlier = ema_score >= calibration.threshold
    
    # 5. 경고 단계 및 지속 시간 판단 [cite: 1232, 1296]
    warning_level = 0
    warning_type = "NONE"
    deviation_duration_ms = 0

    if is_outlier:
        if state.deviation_start_time_ms is None:
            state.deviation_start_time_ms = timestamp_ms # 이탈 시작 시점 기록 [cite: 1320]
            state.deviation_max_ema_score = ema_score
            state.deviation_ema_sum = 0.0
            state.deviation_frame_count = 0

        deviation_duration_ms = timestamp_ms - state.deviation_start_time_ms

        state.deviation_max_ema_score = max(state.deviation_max_ema_score, ema_score)
        state.deviation_ema_sum += ema_score
        state.deviation_frame_count += 1
        
        # 지속 시간에 따른 경고 단계 판정 (5초, 30초, 3분) [cite: 87, 88, 89, 1211]
        
        # if deviation_duration_ms >= 180000: # 3분
        #     warning_level, warning_type = 3, "MODAL_POPUP"
        # elif deviation_duration_ms >= 30000: # 30초
        #     warning_level, warning_type = 2, "PIP_YELLOW_SCREEN"
        # elif deviation_duration_ms >= 5000: # 5초
        #     warning_level, warning_type = 1, "PIP_RED_SCREEN"
        
        # 시연용
        if deviation_duration_ms >= 15000:   # 15초
            warning_level, warning_type = 3, "MODAL_POPUP"
        elif deviation_duration_ms >= 10000: # 10초
            warning_level, warning_type = 2, "AUDIO_ALERT"
        elif deviation_duration_ms >= 5000:  # 5초
            warning_level, warning_type = 1, "VISUAL_ALERT"
    else:
        pass

    return {
        "features": features,
        "mdScore": round(md_score, 2),
        "emaScore": round(ema_score, 2),
        "threshold": calibration.threshold,
        "isOutlier": is_outlier,
        "warningLevel": warning_level,
        "warningType": warning_type,
        "deviationDurationMs": deviation_duration_ms
    } # 설계서 6.3.4 출력 규격 준수 [cite: 1294]