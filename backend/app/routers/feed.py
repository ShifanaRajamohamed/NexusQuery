from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import FeedPost, Vote, Comment, User, AuditLog
from app.schemas import FeedPostCreate, FeedPostOut, CommentCreate, CommentOut
from app.auth import get_current_active_user

router = APIRouter(prefix="/api/feed", tags=["feed"])

@router.get("/posts", response_model=List[FeedPostOut])
def get_feed_posts(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    posts = db.query(FeedPost).order_by(FeedPost.created_at.desc()).all()
    
    out_posts = []
    for post in posts:
        # Get author username
        author = db.query(User).filter(User.id == post.author_id).first()
        author_name = author.username if author else "Anonymous"
        
        # Get comments
        comments = db.query(Comment).filter(Comment.post_id == post.id).all()
        comments_out = []
        for c in comments:
            c_author = db.query(User).filter(User.id == c.user_id).first()
            comments_out.append(CommentOut(
                id=c.id,
                post_id=c.post_id,
                user_id=c.user_id,
                username=c_author.username if c_author else "Anonymous",
                content=c.content,
                created_at=c.created_at
            ))

        # Check votes
        vote = db.query(Vote).filter(Vote.user_id == current_user.id, Vote.post_id == post.id).first()
        has_upvoted = vote is not None and vote.vote_type == "upvote"
        
        out_posts.append(FeedPostOut(
            id=post.id,
            title=post.title,
            content=post.content,
            type=post.type,
            author_id=post.author_id,
            author_username=author_name,
            upvotes=post.upvotes,
            bookmarks=post.bookmarks,
            tags=post.tags,
            created_at=post.created_at,
            comments=comments_out,
            has_upvoted=has_upvoted,
            has_bookmarked=False  # Bookmarks simulated or simple toggle
        ))
        
    return out_posts

@router.post("/post", response_model=FeedPostOut)
def create_feed_post(
    post_in: FeedPostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    post = FeedPost(
        title=post_in.title,
        content=post_in.content,
        type=post_in.type,
        author_id=current_user.id,
        tags=post_in.tags,
        upvotes=0,
        bookmarks=0
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    # Log action
    audit = AuditLog(
        user_id=current_user.id,
        action="FEED_POST",
        target_type="feed_post",
        target_id=post.id,
        details=f"Created feed post: {post_in.title} ({post_in.type})"
    )
    db.add(audit)
    db.commit()

    return FeedPostOut(
        id=post.id,
        title=post.title,
        content=post.content,
        type=post.type,
        author_id=post.author_id,
        author_username=current_user.username,
        upvotes=0,
        bookmarks=0,
        tags=post.tags,
        created_at=post.created_at,
        comments=[],
        has_upvoted=False,
        has_bookmarked=False
    )

@router.post("/posts/{post_id}/vote")
def vote_post(
    post_id: int,
    vote_type: str, # upvote, downvote
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    post = db.query(FeedPost).filter(FeedPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing_vote = db.query(Vote).filter(Vote.user_id == current_user.id, Vote.post_id == post_id).first()
    
    if existing_vote:
        if existing_vote.vote_type == vote_type:
            # Cancel vote
            db.delete(existing_vote)
            if vote_type == "upvote":
                post.upvotes = max(0, post.upvotes - 1)
        else:
            # Change vote
            existing_vote.vote_type = vote_type
            if vote_type == "upvote":
                post.upvotes += 2
            else:
                post.upvotes = max(0, post.upvotes - 2)
    else:
        # New vote
        new_vote = Vote(user_id=current_user.id, post_id=post_id, vote_type=vote_type)
        db.add(new_vote)
        if vote_type == "upvote":
            post.upvotes += 1
            
    db.commit()
    db.refresh(post)
    return {"upvotes": post.upvotes}

@router.post("/posts/{post_id}/comment", response_model=CommentOut)
def comment_post(
    post_id: int,
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    post = db.query(FeedPost).filter(FeedPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comment = Comment(
        post_id=post_id,
        user_id=current_user.id,
        content=comment_in.content
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return CommentOut(
        id=comment.id,
        post_id=comment.post_id,
        user_id=comment.user_id,
        username=current_user.username,
        content=comment.content,
        created_at=comment.created_at
    )
