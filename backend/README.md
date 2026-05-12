# Visual Posture Manager Backend

FastAPI와 MySQL 기반, REST API를 제공

---

## 1. 주요 기능

- 할 일(Task) 생성, 조회, 수정, 삭제
- 캘리브레이션 기준값 저장 및 최근 캘리브레이션 조회
- 뽀모도로 세션 생성, 상세 조회, 일시정지, 재개, 종료
- 세션별 자세 로그 배치 저장
- 세션별 자세 이탈 구간 저장
- 세션별 경고 알림 이력 저장
- 세션별 피드백 저장
- 세션 리포트 조회
- 서버 상태 확인 API 제공
- WebSocket 기반 실시간 자세 분석 구조 포함

---

## 2. 기술 스택

- Python
- FastAPI
- SQLAlchemy
- MySQL
- PyMySQL
- Pydantic
- Uvicorn
- python-dotenv

---

## 3. 설치 방법

필요한 라이브러리를 설치합니다.

```bash
pip install -r requirements.txt
```

---

## 4. 데이터베이스 설정

MySQL에서 사용할 데이터베이스를 생성합니다.

```sql
CREATE DATABASE vpm_db;
USE vpm_db;
```

`app/database.py` 파일에서 DATABASE_URL을 본인 환경에 맞게 설정합니다.

```python
DATABASE_URL = "mysql+pymysql://root:비밀번호@localhost:3306/vpm_db"
```

---

## 5. 서버 실행 방법

backend 폴더 위치에서 아래 명령어를 실행합니다.

```bash
uvicorn app.main:app --reload
```

서버 실행 후 Swagger API 문서는 아래 주소에서 확인할 수 있습니다.

```text
http://127.0.0.1:8000/docs
```

---

## 6. 실행 전 확인 사항

- MySQL 서버가 실행 중이어야 합니다.
- `vpm_db` 데이터베이스가 생성되어 있어야 합니다.
- `DATABASE_URL`의 비밀번호와 DB 이름이 본인 환경과 일치해야 합니다.
- 필요한 라이브러리는 `requirements.txt`로 설치해야 합니다.
- 서버 실행 후 Swagger 문서에서 API 테스트가 가능합니다.