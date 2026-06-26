import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# JWT / Security Settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "nexus-query-ai-super-secret-key-1234567890-qwertyuiop")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Database Connection Settings
# Primary: MySQL. Fallback: SQLite
MYSQL_USER = os.getenv("MYSQL_USER", "nexus_user")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "nexus_password")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_DB = os.getenv("MYSQL_DB", "nexusquery_db")

MYSQL_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
SQLITE_URL = f"sqlite:///{DATA_DIR}/nexusquery.db"

# Vector Store Path
FAISS_INDEX_PATH = str(DATA_DIR / "faiss_index")

# AI & Processing Pipeline Settings
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "500"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "100"))

# OpenAI Settings (Optional fallback for synthesis)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Default Admin User Details
DEFAULT_ADMIN_EMAIL = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@nexusquery.ai")
DEFAULT_ADMIN_PASSWORD = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin123")
DEFAULT_ADMIN_USERNAME = "Admin"
DEFAULT_ADMIN_DEPARTMENT = "Engineering"
