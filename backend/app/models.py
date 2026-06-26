import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="Employee")  # Employee, Team Lead, Admin
    department = Column(String(100), nullable=False)  # Engineering, HR, Finance, Operations
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    knowledge_items = relationship("KnowledgeItem", back_populates="owner")
    contributions = relationship("Contribution", foreign_keys="Contribution.contributor_id", back_populates="contributor")
    feed_posts = relationship("FeedPost", back_populates="author")
    comments = relationship("Comment", back_populates="user")
    notifications = relationship("Notification", back_populates="user")


class KnowledgeItem(Base):
    __tablename__ = "knowledge_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # file, git, wiki, web
    file_path = Column(String(555), nullable=True)
    source_url = Column(String(555), nullable=True)
    department = Column(String(100), nullable=False)
    tags = Column(String(255), nullable=True)  # Comma-separated tags
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    version = Column(String(20), default="1.0.0")
    status = Column(String(50), default="Approved")  # Pending, Approved, Rejected
    permission = Column(String(50), default="Public")  # Public, Department, Admin
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="knowledge_items")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("knowledge_items.id"), nullable=False)
    content = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    keywords = Column(String(500), nullable=True)  # Comma-separated
    topic = Column(String(255), nullable=True)
    named_entities = Column(Text, nullable=True)  # Comma-separated or JSON
    faiss_id = Column(Integer, nullable=True)  # Index in FAISS vector index
    metadata_json = Column(Text, nullable=True)  # JSON string representing dynamic keys
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    document = relationship("KnowledgeItem", back_populates="chunks")


class GitRepository(Base):
    __tablename__ = "git_repositories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    clone_url = Column(String(555), nullable=False)
    status = Column(String(50), default="Pending")  # Cloning, Indexing, Ready, Failed
    last_synced = Column(DateTime, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class WikiSource(Base):
    __tablename__ = "wiki_sources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # Confluence, Notion, Wiki
    source_url = Column(String(555), nullable=False)
    status = Column(String(50), default="Pending")  # Fetching, Indexing, Ready, Failed
    last_synced = Column(DateTime, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Contribution(Base):
    __tablename__ = "contributions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    item_type = Column(String(50), nullable=False)  # document, repo, wiki
    source_url = Column(String(555), nullable=True)
    file_path = Column(String(555), nullable=True)
    department = Column(String(100), nullable=False)
    tags = Column(String(255), nullable=True)
    permission = Column(String(50), default="Public")
    contributor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="Pending")  # Pending, Approved, Rejected
    comments = Column(Text, nullable=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    contributor = relationship("User", foreign_keys=[contributor_id], back_populates="contributions")
    reviewer = relationship("User", foreign_keys=[reviewer_id])


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(255), nullable=False)  # e.g., "USER_LOGIN", "DOC_UPLOAD"
    target_type = Column(String(100), nullable=True)
    target_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


class SearchLog(Base):
    __tablename__ = "search_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    query = Column(Text, nullable=False)
    answer = Column(Text, nullable=True)
    response_time_ms = Column(Integer, default=0)
    confidence_score = Column(Float, default=0.0)
    failed_search = Column(Boolean, default=False)  # True if no matches found
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


class FeedPost(Base):
    __tablename__ = "feed_posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    type = Column(String(50), default="Post")  # Announcement, Post, Question
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    upvotes = Column(Integer, default=0)
    bookmarks = Column(Integer, default=0)
    tags = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    author = relationship("User", back_populates="feed_posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")


class Vote(Base):
    __tablename__ = "feed_votes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("feed_posts.id"), nullable=False)
    vote_type = Column(String(20), nullable=False)  # upvote, downvote


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("feed_posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    post = relationship("FeedPost", back_populates="comments")
    user = relationship("User", back_populates="comments")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="system")  # knowledge, git, wiki, contribution, system
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")
