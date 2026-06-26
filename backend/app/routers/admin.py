from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models import User, AuditLog, KnowledgeItem, DocumentChunk
from app.schemas import UserOut, AuditLogOut
from app.auth import require_admin
from app.pipeline import faiss_manager, embedding_model

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/users", response_model=List[UserOut])
def get_all_users(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return db.query(User).all()

@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    role: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    if role not in ["Employee", "Team Lead", "Admin"]:
        raise HTTPException(status_code=400, detail="Invalid role specified")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_role = user.role
    user.role = role
    
    # Log action
    audit = AuditLog(
        user_id=admin.id,
        action="ADMIN_UPDATE_ROLE",
        target_type="user",
        target_id=user_id,
        details=f"Updated role for {user.username} from {old_role} to {role}"
    )
    db.add(audit)
    db.commit()

    return {"message": f"Successfully updated user role to {role}"}

@router.put("/users/{user_id}/status")
def toggle_user_status(
    user_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot change your own status")

    user.is_active = is_active
    
    # Log action
    audit = AuditLog(
        user_id=admin.id,
        action="ADMIN_TOGGLE_STATUS",
        target_type="user",
        target_id=user_id,
        details=f"Set status for {user.username} to active={is_active}"
    )
    db.add(audit)
    db.commit()

    return {"message": f"Successfully set user active state to {is_active}"}

@router.get("/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    
    out_logs = []
    for log in logs:
        user = db.query(User).filter(User.id == log.user_id).first()
        out_logs.append(AuditLogOut(
            id=log.id,
            user_id=log.user_id,
            username=user.username if user else "System",
            action=log.action,
            target_type=log.target_type,
            target_id=log.target_id,
            details=log.details,
            timestamp=log.timestamp
        ))
    return out_logs

def rebuild_embedding_index_task(db_session_factory):
    """Background task to fetch all chunks and compile them into a new FAISS index."""
    import faiss
    db = next(db_session_factory())
    try:
        logger = rebuild_embedding_index_task.__import__('logging').getLogger(__name__)
        logger.info("Starting background FAISS index rebuild...")
        
        chunks = db.query(DocumentChunk).all()
        if not chunks:
            logger.info("No chunks to index.")
            return

        # Re-encode all chunk texts
        texts = [c.content for c in chunks]
        embeddings = embedding_model.encode(texts)

        # Clear existing FAISS vectors
        faiss_manager.index = faiss.IndexFlatIP(embedding_model.dimension)
        faiss_ids = faiss_manager.add_vectors(embeddings)

        # Re-associate FAISS ids
        for i, chunk in enumerate(chunks):
            chunk.faiss_id = faiss_ids[i]
            
        db.commit()
        logger.info("Successfully rebuilt FAISS index and database matches.")
    except Exception as e:
        import traceback
        print(f"Error during reindex: {e}")
        traceback.print_exc()

@router.post("/reindex")
def trigger_system_reindex(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    # Reindex everything from database in background
    background_tasks.add_task(rebuild_embedding_index_task, get_db)
    
    audit = AuditLog(
        user_id=admin.id,
        action="ADMIN_TRIGGER_REINDEX",
        details="Triggered full FAISS vector database re-index job"
    )
    db.add(audit)
    db.commit()

    return {"message": "Background re-indexing job triggered successfully."}
