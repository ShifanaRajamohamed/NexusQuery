import datetime
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Contribution, User, AuditLog, KnowledgeItem, GitRepository, WikiSource
from app.schemas import ContributionCreate, ContributionOut, ContributionReview
from app.auth import get_current_active_user, require_admin, require_team_lead
from app.gitquery import clone_and_index_repository
from app.wikiquery import crawl_and_index_wiki

router = APIRouter(prefix="/api/contribute", tags=["contribute"])
logger = logging.getLogger(__name__)

@router.post("/submit", response_model=ContributionOut, status_code=status.HTTP_201_CREATED)
def submit_contribution(
    contrib_in: ContributionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    contrib = Contribution(
        title=contrib_in.title,
        item_type=contrib_in.item_type,
        source_url=contrib_in.source_url,
        department=contrib_in.department,
        tags=contrib_in.tags,
        permission=contrib_in.permission,
        contributor_id=current_user.id,
        status="Pending"
    )
    db.add(contrib)
    db.commit()
    db.refresh(contrib)

    # Log action
    audit = AuditLog(
        user_id=current_user.id,
        action="CONTRIBUTE_SUBMIT",
        target_type="contribution",
        target_id=contrib.id,
        details=f"Submitted contribution: {contrib_in.title} ({contrib_in.item_type})"
    )
    db.add(audit)
    db.commit()

    return contrib

@router.get("/list", response_model=List[ContributionOut])
def list_contributions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Admins/Team Leads view all contributions, Employees view their own submissions
    if current_user.role in ["Admin", "Team Lead"]:
        return db.query(Contribution).all()
    else:
        return db.query(Contribution).filter(Contribution.contributor_id == current_user.id).all()

@router.post("/{contrib_id}/review")
def review_contribution(
    contrib_id: int,
    review: ContributionReview,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_team_lead)
):
    contrib = db.query(Contribution).filter(Contribution.id == contrib_id).first()
    if not contrib:
        raise HTTPException(status_code=404, detail="Contribution not found")

    contrib.status = review.status
    contrib.comments = review.comments
    contrib.reviewer_id = current_user.id
    contrib.reviewed_at = datetime.datetime.utcnow()
    db.commit()

    # Log action
    audit = AuditLog(
        user_id=current_user.id,
        action=f"CONTRIBUTE_REVIEW_{review.status.upper()}",
        target_type="contribution",
        target_id=contrib.id,
        details=f"Reviewed contribution ID {contrib.id}. Status: {review.status}"
    )
    db.add(audit)
    db.commit()

    # If Approved, spawn the knowledge source automatically
    if review.status == "Approved":
        if contrib.item_type == "document":
            # Document needs an uploaded file path, or acts as a web URL
            k_item = KnowledgeItem(
                title=contrib.title,
                type="web" if contrib.source_url else "file",
                source_url=contrib.source_url,
                file_path=contrib.file_path,
                department=contrib.department,
                tags=contrib.tags,
                owner_id=contrib.contributor_id,
                version="1.0.0",
                status="Approved",
                permission=contrib.permission
            )
            db.add(k_item)
            db.commit()
            
            # If there's a Web URL, crawl it
            if contrib.source_url:
                # Use WikiSource crawling helper since it operates on URLs
                wiki_temp = WikiSource(
                    title=contrib.title,
                    type="Wiki",
                    source_url=contrib.source_url,
                    status="Pending",
                    owner_id=contrib.contributor_id
                )
                db.add(wiki_temp)
                db.commit()
                background_tasks.add_task(crawl_and_index_wiki, wiki_temp.id, db)

        elif contrib.item_type == "repo":
            git_repo = GitRepository(
                name=contrib.title,
                clone_url=contrib.source_url,
                status="Pending",
                owner_id=contrib.contributor_id
            )
            db.add(git_repo)
            db.commit()
            background_tasks.add_task(clone_and_index_repository, git_repo.id, db)

        elif contrib.item_type == "wiki":
            wiki = WikiSource(
                title=contrib.title,
                type="Wiki",
                source_url=contrib.source_url,
                status="Pending",
                owner_id=contrib.contributor_id
            )
            db.add(wiki)
            db.commit()
            background_tasks.add_task(crawl_and_index_wiki, wiki.id, db)

    return {"message": f"Contribution status updated to {review.status}."}
