import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base, SessionLocal
from app.config import DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD, DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_DEPARTMENT
from app.models import User
from app.auth import get_password_hash
from app.routers import auth, dashboard, knowledge, git, wiki, chat, contribute, feed, notifications, analytics, admin

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 1. Initialize DB tables
try:
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
except Exception as e:
    logger.error(f"Error initializing database: {e}")

# 2. Bootstrap default Admin User
db = SessionLocal()
try:
    admin_user = db.query(User).filter(User.email == DEFAULT_ADMIN_EMAIL).first()
    if not admin_user:
        logger.info("Bootstrapping default Admin user...")
        hashed_pw = get_password_hash(DEFAULT_ADMIN_PASSWORD)
        admin_user = User(
            username=DEFAULT_ADMIN_USERNAME,
            email=DEFAULT_ADMIN_EMAIL,
            hashed_password=hashed_pw,
            role="Admin",
            department=DEFAULT_ADMIN_DEPARTMENT,
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        logger.info(f"Default admin user created successfully ({DEFAULT_ADMIN_EMAIL}).")
except Exception as e:
    logger.error(f"Failed to bootstrap default Admin user: {e}")
finally:
    db.close()

# 3. Create FastAPI app
app = FastAPI(
    title="NexusQuery AI API",
    description="Enterprise Knowledge Discovery Platform Backend API",
    version="1.0.0"
)

# 4. Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development. Secure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Include API routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(knowledge.router)
app.include_router(git.router)
app.include_router(wiki.router)
app.include_router(chat.router)
app.include_router(contribute.router)
app.include_router(feed.router)
app.include_router(notifications.router)
app.include_router(analytics.router)
app.include_router(admin.router)

@app.get("/")
def home():
    return {
        "status": "online",
        "service": "NexusQuery AI Backend",
        "version": "1.0.0"
    }
