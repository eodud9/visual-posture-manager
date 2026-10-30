# Visual Posture Manager

> MediaPipe 기반 실시간 자세 모니터링과 집중 세션 기록을 제공하는 웹 서비스

Visual Posture Manager는 웹캠에서 추출한 신체 랜드마크를 바탕으로 사용자의 자세 변화를 감지하고, 자세 이탈이 지속될 때 단계별 알림을 제공하는 팀 프로젝트입니다. 집중 타이머와 세션별 리포트를 함께 제공하여 사용자가 작업 중 자신의 자세 습관을 돌아볼 수 있도록 설계했습니다.

## 주요 기능

| 기능 | 설명 |
| --- | --- |
| 자세 캘리브레이션 | MediaPipe Pose로 추출한 귀·어깨 랜드마크에서 3개 특징량을 계산하고, 100개의 샘플을 바탕으로 개인 기준 자세를 설정 |
| 실시간 자세 모니터링 | 프론트엔드에서 랜드마크를 추출한 뒤 WebSocket으로 백엔드에 전달하여 자세 이탈 여부를 분석 |
| 단계별 자세 알림 | 자세 이탈이 지속되면 시각 경고, 경고음, 모달을 단계적으로 표시 |
| 집중 세션 | 집중 타이머, 일시정지·재개·종료와 세션 데이터 관리 |
| 세션 리포트 | 바른 자세 유지율, 이탈 횟수, 이탈 구간 타임라인과 시간대별 분포 제공 |
| 작업 관리 | 할 일(Task) 등록·조회·수정·삭제 API 제공 |
| 미니 화면 | 지원 브라우저에서 Document Picture-in-Picture를 활용해 집중 타이머와 자세 경고 표시 |

> 알림 지속 시간은 현재 코드에서 **5초(시각 경고) → 10초(경고음) → 15초(모달)**로 설정되어 있습니다. 데모용 임계값이며, 코드 주석의 과거 기준과는 다릅니다.

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| Frontend | React, JavaScript, Vite, Tailwind CSS, React Router |
| Pose Detection | MediaPipe Pose |
| 실시간 통신 | WebSocket |
| Backend | Python, FastAPI, Pydantic, SQLAlchemy |
| Database | MySQL, PyMySQL |
| 시각화 | Recharts 및 자체 타임라인 UI |

## 시스템 구조

```text
사용자 웹캠
    |
    v
React + MediaPipe Pose (브라우저)
    |  - 신체 랜드마크 추출
    |  - 개인 기준 자세 캘리브레이션
    |
    +--- REST API: 캘리브레이션/세션/할 일/리포트
    |                  |
    |                  v
    |              FastAPI ------ MySQL
    |
    +--- WebSocket: 랜드마크 프레임 ---> FastAPI 자세 분석
                                             |
                                  MD Score + EMA + 이탈 판정
                                             |
                               실시간 분석 결과 WebSocket 반환
                                             |
                                             v
                              React 알림 / PiP / 세션 화면
```

웹캠 영상에서 MediaPipe Pose 랜드마크를 추출하는 작업은 브라우저에서 수행합니다. 모니터링 단계에는 **원본 영상 프레임이 아닌 랜드마크 좌표와 타임스탬프**를 WebSocket으로 전송합니다. 백엔드는 자세 분석 결과 및 자세 이탈 이력을 처리하고 저장합니다.

## 자세 분석 흐름

1. **캘리브레이션**: 귀(7, 8)와 어깨(11, 12) 랜드마크를 이용해 `z_ratio`, `neck_tilt`, `body_slope`를 계산합니다. 100개 샘플의 중앙값과 공분산 행렬을 기준으로 개인별 기준 자세를 생성합니다.
2. **랜드마크 전송**: 모니터링 단계에서는 MediaPipe 결과를 프레임 단위로 처리하며, 일부 프레임을 샘플링해 `landmark_frame` 메시지를 WebSocket으로 전송합니다.
3. **이탈 분석**: FastAPI에서 캘리브레이션 기준과 현재 특징량 사이의 마할라노비스 거리(Mahalanobis Distance)를 계산하고, EMA(지수이동평균)로 변동을 완화해 자세 이탈 여부를 판정합니다.
4. **결과 반영**: `analysis_result` 메시지의 점수·이탈 여부를 프론트엔드에 반영하고, 자세 이탈이 지속되면 경고 UI를 표시합니다.
5. **기록 및 리포트**: 백엔드에서 자세 로그와 이탈 구간, 경고 정보를 저장하고 세션 리포트에서 집계하여 보여줍니다.

### WebSocket 메시지 예시

연결 경로: `ws://localhost:8000/ws/sessions/{session_id}/posture`

송신 예시:

```json
{
  "type": "landmark_frame",
  "timestampMs": 1730000000000,
  "landmarks": [
    { "id": 7, "x": 0.45, "y": 0.30, "z": -0.10, "visibility": 0.99 }
  ]
}
```

위 메시지는 형식을 보여주기 위한 축약 예시입니다. 실제 자세 분석에는 귀와 어깨를 포함한 필요한 랜드마크가 있어야 합니다.

응답 필드: `type: analysis_result`, `emaScore`, `mdScore`, `isOutlier`, `warningLevel`, `warningType`, `deviationDurationMs`, `threshold`.

## 개인정보 보호 고려

이 프로젝트에서는 웹캠에 담기는 사용자 영상정보의 노출 가능성을 고려했습니다. 브라우저에서 영상으로부터 랜드마크를 추출한 후 좌표 데이터를 전송하는 구조를 선택했으며, **원본 영상을 지속적으로 저장하는 기능은 구현하지 않았습니다.** 다만 랜드마크·자세 로그 등 파생 데이터는 서버와 DB에서 처리되므로, 이를 영상정보와 무관한 데이터라고 간주하거나 완전한 익명성을 보장한다고 설명하지 않습니다.

## 담당 역할

**프론트엔드 개발 및 프론트·백엔드 통합 담당**

- React 기반 화면과 사용자 인터랙션 구현
- JavaScript 환경에서 MediaPipe 기반 자세 감지·캘리브레이션 로직 구현
- REST API 및 WebSocket을 활용한 프론트엔드·백엔드 연동
- 작업 흐름의 기능 통합과 프로젝트 전반의 디버깅
- 영상정보 저장 및 개인정보 보호 방안에 대한 팀 설계 논의 참여

## 프로젝트 구조

```text
visual-posture-manager/
├── frontend/
│   ├── src/
│   │   ├── api/               # REST API 호출
│   │   ├── components/        # 페이지 및 작업 화면
│   │   │   └── workspace/     # 웹캠, 타이머, 캘리브레이션, 알림
│   │   └── utils/
│   │       └── postureEngine.js  # 캘리브레이션 로직
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── routers/           # REST / WebSocket 엔드포인트
│   │   ├── crud/              # DB 접근
│   │   ├── models/            # SQLAlchemy 모델
│   │   ├── schemas/           # 데이터 스키마
│   │   └── services/          # 자세 분석 및 세션 상태
│   ├── requirements.txt
│   └── .env.example
└── README.md
```

## 로컬 실행

### 1. 저장소 복제

```bash
git clone https://github.com/eodud9/visual-posture-manager.git
cd visual-posture-manager
```

### 2. MySQL 준비 및 백엔드 실행

MySQL에서 데이터베이스를 생성합니다.

```sql
CREATE DATABASE vpm_db;
```

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

`backend/.env`의 `DATABASE_URL`을 실제 MySQL 접속 정보로 수정합니다.

```env
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/vpm_db
```

```bash
uvicorn app.main:app --reload
```

- REST API: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`

### 3. 프론트엔드 실행

새 터미널에서 실행합니다.

```bash
cd frontend
npm install
npm run dev
```

로컬 연결 환경변수 예시 (`frontend/.env.development`):

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

브라우저에서 Vite가 안내하는 로컬 주소(기본 `http://localhost:5173`)에 접속하고 카메라 접근 권한을 허용합니다. Document Picture-in-Picture 기능은 지원하는 브라우저에서만 동작합니다.

## 구현 참고사항

- `frontend/src/components/workspace/hooks/UsePoseDetection.js`: MediaPipe 초기화, 캘리브레이션 처리, WebSocket 통신
- `frontend/src/utils/postureEngine.js`: 개인 기준 자세 캘리브레이션
- `frontend/src/components/workspace/hooks/UsePostureAlert.js`: 자세 이탈 단계별 알림
- `frontend/src/components/workspace/hooks/UsePip.js`: 미니 타이머와 경고 UI
- `backend/app/routers/posture_ws.py`: WebSocket 데이터 수신, 분석 결과 반환, 자세 기록 저장
- `backend/app/services/posture_analyzer.py`: 특징량·마할라노비스 거리·EMA 기반 이탈 분석

## 향후 개선할 점

- 브라우저 및 카메라 환경별 자세 인식 안정성 검증
- WebSocket 연결 해제 및 재연결 처리 보완
- 사용자 인증·접근 제어와 개인정보 처리 정책 고도화
- 자동화 테스트 및 실제 사용 시나리오 기반 성능 검증

---

**Repository:** https://github.com/eodud9/visual-posture-manager
