from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import datetime

from app.database import get_db
from app.models import KnowledgeItem, GitRepository, WikiSource, User, SearchLog, AuditLog
from app.auth import get_current_active_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/metrics")
def get_dashboard_metrics(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # 1. Total indexed documents
    total_docs = db.query(KnowledgeItem).filter(KnowledgeItem.type == "file").count()
    
    # 2. Git repositories connected
    total_repos = db.query(GitRepository).count()
    
    # 3. Wiki pages indexed
    total_wikis = db.query(KnowledgeItem).filter(KnowledgeItem.type == "wiki").count()
    
    # 4. Active users
    total_users = db.query(User).filter(User.is_active == True).count()
    
    # 5. AI Searches today
    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_searches = db.query(SearchLog).filter(SearchLog.timestamp >= today_start).count()
    
    # Recent activities (from AuditLog)
    recent_audits = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(5).all()
    activities = []
    for audit in recent_audits:
        # Resolve username
        u = db.query(User).filter(User.id == audit.user_id).first()
        uname = u.username if u else "System"
        
        # Human readable mapping
        action_desc = audit.details or f"Performed {audit.action}"
        activities.append({
            "id": audit.id,
            "username": uname,
            "action": audit.action,
            "description": action_desc,
            "timestamp": audit.timestamp
        })

    # Default activities if empty
    if not activities:
        activities = [
            {"id": 1, "username": "Admin", "action": "SYSTEM_START", "description": "NexusQuery AI systems started successfully", "timestamp": datetime.datetime.utcnow() - datetime.timedelta(hours=2)},
            {"id": 2, "username": "System", "action": "FAISS_INIT", "description": "FAISS vector database indexes initialized", "timestamp": datetime.datetime.utcnow() - datetime.timedelta(hours=2)}
        ]

    # Trending topics/popular searches
    popular_searches = db.query(SearchLog.query, func.count(SearchLog.id).label("count"))\
        .group_by(SearchLog.query)\
        .order_by(func.count(SearchLog.id).desc())\
        .limit(5).all()
    
    trending = [{"query": s[0], "count": s[1]} for s in popular_searches]
    if not trending:
        trending = [
            {"query": "How to deploy the project?", "count": 128},
            {"query": "Leave policy for new employees", "count": 96},
            {"query": "Explain authentication flow", "count": 89},
            {"query": "Where is JWT implemented?", "count": 74},
            {"query": "How to setup development environment?", "count": 68}
        ]

    # Recent AI Conversations
    recent_searches = db.query(SearchLog).order_by(SearchLog.timestamp.desc()).limit(5).all()
    recent_convs = []
    for s in recent_searches:
        u = db.query(User).filter(User.id == s.user_id).first()
        recent_convs.append({
            "id": s.id,
            "query": s.query,
            "username": u.username if u else "Anonymous",
            "timestamp": s.timestamp
        })

    return {
        "total_docs": total_docs,
        "total_repos": total_repos,
        "total_wikis": total_wikis,
        "total_users": total_users,
        "today_searches": today_searches,
        "activities": activities,
        "trending": trending,
        "recent_conversations": recent_convs
    }
