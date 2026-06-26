from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth Schemas ---

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = "Employee"  # Employee, Team Lead, Admin
    department: str  # Engineering, HR, Finance, Operations

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class PasswordReset(BaseModel):
    email: EmailStr
    new_password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None
    email: Optional[str] = None

class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str
    department: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Knowledge Hub Schemas ---

class KnowledgeItemCreate(BaseModel):
    title: str
    type: str  # file, git, wiki, web
    file_path: Optional[str] = None
    source_url: Optional[str] = None
    department: str
    tags: Optional[str] = None
    permission: str = "Public"  # Public, Department, Admin

class KnowledgeItemOut(BaseModel):
    id: int
    title: str
    type: str
    file_path: Optional[str] = None
    source_url: Optional[str] = None
    department: str
    tags: Optional[str] = None
    owner_id: Optional[int] = None
    version: str
    status: str
    permission: str
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentChunkOut(BaseModel):
    id: int
    document_id: int
    content: str
    summary: Optional[str] = None
    keywords: Optional[str] = None
    topic: Optional[str] = None
    named_entities: Optional[str] = None
    faiss_id: Optional[int] = None
    metadata_json: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- GitQuery Schemas ---

class GitRepositoryCreate(BaseModel):
    name: str
    clone_url: str

class GitRepositoryOut(BaseModel):
    id: int
    name: str
    clone_url: str
    status: str
    last_synced: Optional[datetime] = None
    owner_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- WikiQuery Schemas ---

class WikiSourceCreate(BaseModel):
    title: str
    type: str  # Confluence, Notion, Wiki
    source_url: str

class WikiSourceOut(BaseModel):
    id: int
    title: str
    type: str
    source_url: str
    status: str
    last_synced: Optional[datetime] = None
    owner_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Contributions Schemas ---

class ContributionCreate(BaseModel):
    title: str
    item_type: str  # document, repo, wiki
    source_url: Optional[str] = None
    department: str
    tags: Optional[str] = None
    permission: str = "Public"

class ContributionReview(BaseModel):
    status: str  # Approved, Rejected, ChangesRequested
    comments: Optional[str] = None

class ContributionOut(BaseModel):
    id: int
    title: str
    item_type: str
    source_url: Optional[str] = None
    file_path: Optional[str] = None
    department: str
    tags: Optional[str] = None
    permission: str
    contributor_id: int
    status: str
    comments: Optional[str] = None
    reviewer_id: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Search & Chat Schemas ---

class SearchQuery(BaseModel):
    query: str

class SourceCitation(BaseModel):
    document_id: int
    title: str
    type: str
    source_url: Optional[str] = None
    file_path: Optional[str] = None
    chunk_content: str
    confidence: float

class SearchResultOut(BaseModel):
    answer: str
    confidence_score: float
    citations: List[SourceCitation]
    related_questions: List[str]

class ChatMessage(BaseModel):
    role: str  # user, assistant
    content: str

class ChatSessionCreate(BaseModel):
    title: str

# --- Feed / Collaborative Schemas ---

class FeedPostCreate(BaseModel):
    title: str
    content: str
    type: str = "Post"  # Announcement, Post, Question
    tags: Optional[str] = None

class CommentCreate(BaseModel):
    content: str

class CommentOut(BaseModel):
    id: int
    post_id: int
    user_id: int
    username: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class FeedPostOut(BaseModel):
    id: int
    title: str
    content: str
    type: str
    author_id: int
    author_username: str
    upvotes: int
    bookmarks: int
    tags: Optional[str] = None
    created_at: datetime
    comments: List[CommentOut] = []
    has_upvoted: bool = False
    has_bookmarked: bool = False

    class Config:
        from_attributes = True

# --- Notification Schemas ---

class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Audit Logs ---

class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    username: Optional[str] = None
    action: str
    target_type: Optional[str] = None
    target_id: Optional[int] = None
    details: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
