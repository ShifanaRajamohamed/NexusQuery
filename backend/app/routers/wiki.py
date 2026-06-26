import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import WikiSource, User, AuditLog
from app.schemas import WikiSourceCreate, WikiSourceOut
from app.auth import get_current_active_user
from app.wikiquery import crawl_and_index_wiki

router = APIRouter(prefix="/api/wiki", tags=["wiki"])
logger = logging.getLogger(__name__)

@router.post("/connect", response_model=WikiSourceOut, status_code=status.HTTP_201_CREATED)
def connect_wiki(
    wiki_in: WikiSourceCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check duplicate
    existing = db.query(WikiSource).filter(WikiSource.source_url == wiki_in.source_url).first()
    if existing:
        raise HTTPException(status_code=400, detail="Wiki source already connected")

    wiki = WikiSource(
        title=wiki_in.title,
        type=wiki_in.type,
        source_url=wiki_in.source_url,
        status="Pending",
        owner_id=current_user.id
    )
    db.add(wiki)
    db.commit()
    db.refresh(wiki)

    # Log action
    audit = AuditLog(
        user_id=current_user.id,
        action="WIKI_CONNECT",
        target_type="wiki",
        target_id=wiki.id,
        details=f"Connected Wiki Source: {wiki_in.title} ({wiki_in.type})"
    )
    db.add(audit)
    db.commit()

    # Trigger background crawling
    background_tasks.add_task(crawl_and_index_wiki, wiki.id, db)

    return wiki

@router.get("/list", response_model=List[WikiSourceOut])
def list_wikis(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(WikiSource).all()

@router.post("/{wiki_id}/sync")
def sync_wiki(
    wiki_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    wiki = db.query(WikiSource).filter(WikiSource.id == wiki_id).first()
    if not wiki:
        raise HTTPException(status_code=404, detail="Wiki source not found")

    wiki.status = "Pending"
    db.commit()

    # Trigger background crawling
    background_tasks.add_task(crawl_and_index_wiki, wiki.id, db)

    return {"message": "Syncing triggered in background."}
