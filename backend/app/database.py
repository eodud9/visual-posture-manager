from sqlalchemy import create_engine                        # DB 연결 객체 생성
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "").replace(
    "mysql://", "mysql+pymysql://"
)

if DATABASE_URL is None:
    raise ValueError("DATABASE_URL 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,   # 연결 끊김 방지
    echo=False,            # SQL 로그 출력 (개발용) → 운영 → False로 변경
    connect_args={"charset": "utf8mb4"}  # 한글 깨짐 방지
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

# DB 세션 생성 함수 (API에서 사용)
def get_db():
    db = SessionLocal() # DB 작업 통로 생성
    try:
        yield db        # router에게 DB 작업 통로 전달
    finally:
        db.close()      # 작업 끝나면 통로 닫기