from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings


def _get_engine():
    from sqlalchemy import create_engine
    return create_engine(
        settings.database_url,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False,
    )


engine = None
SessionLocal = None


def _init_db():
    global engine, SessionLocal
    if engine is None:
        engine = _get_engine()
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


Base = declarative_base()


def get_db():
    _init_db()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_raw_connection():
    import pyodbc
    return pyodbc.connect(settings.pyodbc_connection_string)


def test_connection():
    try:
        _init_db()
        with engine.connect() as conn:
            from sqlalchemy import text
            result = conn.execute(text("SELECT 1 AS test"))
            row = result.fetchone()
            return row[0] == 1
    except Exception:
        return False
