import os
import json
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import GitRepository, User, AuditLog
from app.schemas import GitRepositoryCreate, GitRepositoryOut
from app.auth import get_current_active_user
from app.gitquery import clone_and_index_repository, IGNORE_DIRS
from app.config import DATA_DIR

router = APIRouter(prefix="/api/git", tags=["git"])
logger = logging.getLogger(__name__)

@router.post("/connect", response_model=GitRepositoryOut, status_code=status.HTTP_201_CREATED)
def connect_repository(
    repo_in: GitRepositoryCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if duplicate clone URL
    existing = db.query(GitRepository).filter(GitRepository.clone_url == repo_in.clone_url).first()
    if existing:
        raise HTTPException(status_code=400, detail="Repository already connected")

    repo = GitRepository(
        name=repo_in.name,
        clone_url=repo_in.clone_url,
        status="Pending",
        owner_id=current_user.id
    )
    db.add(repo)
    db.commit()
    db.refresh(repo)

    # Log action
    audit = AuditLog(
        user_id=current_user.id,
        action="GIT_CONNECT",
        target_type="git",
        target_id=repo.id,
        details=f"Connected Git Repository: {repo_in.name}"
    )
    db.add(audit)
    db.commit()

    # Trigger background task
    background_tasks.add_task(clone_and_index_repository, repo.id, db)

    return repo

@router.get("/list", response_model=List[GitRepositoryOut])
def list_repositories(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(GitRepository).all()

@router.post("/{repo_id}/sync")
def sync_repository(
    repo_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    repo = db.query(GitRepository).filter(GitRepository.id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    repo.status = "Pending"
    db.commit()

    # Trigger background task
    background_tasks.add_task(clone_and_index_repository, repo.id, db)

    return {"message": "Syncing triggered in background."}

def build_tree_node(dir_path: str, root_path: str) -> dict:
    """Builds a JSON directory tree node recursively."""
    name = os.path.basename(dir_path)
    relative_path = os.path.relpath(dir_path, root_path)
    
    node = {
        "name": name,
        "path": relative_path.replace("\\", "/"),
        "type": "directory",
        "children": []
    }
    
    try:
        for entry in os.scandir(dir_path):
            if entry.name in IGNORE_DIRS:
                continue
            if entry.is_dir():
                node["children"].append(build_tree_node(entry.path, root_path))
            elif entry.is_file():
                node["children"].append({
                    "name": entry.name,
                    "path": os.path.relpath(entry.path, root_path).replace("\\", "/"),
                    "type": "file"
                })
    except Exception as e:
        logger.error(f"Error reading directory {dir_path}: {e}")
        
    # Sort children: directories first, then files alphabetically
    node["children"].sort(key=lambda x: (x["type"] != "directory", x["name"].lower()))
    return node

@router.get("/{repo_id}/tree")
def get_repository_tree(
    repo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    repo = db.query(GitRepository).filter(GitRepository.id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    if repo.status != "Ready":
        raise HTTPException(status_code=400, detail=f"Repository is not ready. Current status: {repo.status}")

    repo_dir = DATA_DIR / "git_clones" / str(repo.id)
    if not repo_dir.exists():
        raise HTTPException(status_code=404, detail="Repository directory not found on disk")

    tree = []
    try:
        for entry in os.scandir(str(repo_dir)):
            if entry.name in IGNORE_DIRS:
                continue
            if entry.is_dir():
                tree.append(build_tree_node(entry.path, str(repo_dir)))
            elif entry.is_file():
                tree.append({
                    "name": entry.name,
                    "path": os.path.relpath(entry.path, str(repo_dir)).replace("\\", "/"),
                    "type": "file"
                })
        tree.sort(key=lambda x: (x["type"] != "directory", x["name"].lower()))
        return tree
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file tree: {e}")

@router.get("/{repo_id}/file")
def get_repository_file(
    repo_id: int,
    path: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    repo = db.query(GitRepository).filter(GitRepository.id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    repo_dir = DATA_DIR / "git_clones" / str(repo.id)
    file_path = repo_dir / path

    # Directory traversal safety check
    resolved_path = os.path.abspath(str(file_path))
    resolved_repo_dir = os.path.abspath(str(repo_dir))
    if not resolved_path.startswith(resolved_repo_dir):
        raise HTTPException(status_code=403, detail="Directory traversal attempt detected")

    if not os.path.exists(resolved_path) or os.path.isdir(resolved_path):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        with open(resolved_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        return {
            "name": os.path.basename(resolved_path),
            "path": path,
            "content": content
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {e}")
