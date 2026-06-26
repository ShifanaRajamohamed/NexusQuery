import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.exc import OperationalError
from app.config import MYSQL_URL, SQLITE_URL

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Base = declarative_base()

# Attempt to initialize MySQL. Fall back to SQLite on operational failure.
engine = None
SessionLocal = None
is_sqlite = False

try:
    logger.info("Attempting to connect to MySQL database...")
    # Add connect_timeout to fail fast if MySQL is not running
    engine = create_engine(MYSQL_URL, pool_pre_ping=True, connect_args={"connect_timeout": 3})
    # Test connection
    with engine.connect() as conn:
        logger.info("Successfully connected to MySQL database.")
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except (OperationalError, Exception) as e:
    logger.warning(f"MySQL connection failed: {e}. Falling back to SQLite local database...")
    engine = create_engine(
        SQLITE_URL, 
        connect_args={"check_same_thread": False} if "sqlite" in SQLITE_URL else {}
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    is_sqlite = True
    logger.info(f"Initialized SQLite database at {SQLITE_URL}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
