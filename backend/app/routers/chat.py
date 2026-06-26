import json
import time
import logging
from typing import AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, SearchLog, AuditLog
from app.schemas import SearchQuery, SearchResultOut
from app.auth import get_current_active_user
from app.search import run_hybrid_search, generate_ai_answer, log_search

router = APIRouter(prefix="/api/chat", tags=["chat"])
logger = logging.getLogger(__name__)

@router.post("/query", response_model=SearchResultOut)
def query_knowledge_base(
    payload: SearchQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    start_time = time.time()
    
    # 1. Run hybrid search
    citations = run_hybrid_search(payload.query, db, limit=5)
    
    # 2. Synthesize answer
    answer, confidence, follow_ups = generate_ai_answer(payload.query, citations)
    
    # 3. Log search query
    elapsed = int((time.time() - start_time) * 1000)
    failed = len(citations) == 0
    log_search(current_user.id, payload.query, answer, elapsed, confidence, failed, db)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="AI_SEARCH",
        details=f"Query: '{payload.query[:60]}' | Confidence: {int(confidence*100)}%"
    )
    db.add(audit)
    db.commit()

    return {
        "answer": answer,
        "confidence_score": confidence,
        "citations": citations,
        "related_questions": follow_ups
    }

@router.post("/stream")
def query_knowledge_base_stream(
    payload: SearchQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    start_time = time.time()
    
    # 1. Hybrid search retrieval
    citations = run_hybrid_search(payload.query, db, limit=5)
    
    # 2. Synthesize answer
    answer, confidence, follow_ups = generate_ai_answer(payload.query, citations)
    
    # Logging helper
    elapsed = int((time.time() - start_time) * 1000)
    failed = len(citations) == 0
    log_search(current_user.id, payload.query, answer, elapsed, confidence, failed, db)

    # 3. Generator to stream the word-by-word output + final structured fields
    async def event_generator() -> AsyncGenerator[str, None]:
        # Divide answer into words to simulate streaming tokens
        words = answer.split(" ")
        for i, word in enumerate(words):
            # Stream token word
            yield f"data: {json.dumps({'token': word + (' ' if i < len(words)-1 else '')})}\n\n"
            time.sleep(0.03) # Simulation delay
            
        # Stream final structured payload
        final_payload = {
            "done": True,
            "confidence_score": confidence,
            "citations": citations,
            "related_questions": follow_ups
        }
        yield f"data: {json.dumps(final_payload)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
