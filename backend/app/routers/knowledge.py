import os
import time
import json
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
import aiofiles

from app.database import get_db
from app.models import KnowledgeItem, DocumentChunk, User, AuditLog
from app.schemas import KnowledgeItemOut, DocumentChunkOut
from app.auth import get_current_active_user
from app.config import DATA_DIR
from app.pipeline import (
    extract_text_from_pdf,
    extract_text_from_docx,
    extract_text_from_pptx,
    extract_text_from_html,
    clean_text,
    split_text_into_chunks,
    extract_metadata_from_chunk,
    embedding_model,
    faiss_manager
)

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])
logger = logging.getLogger(__name__)

# Ensure upload directory exists
UPLOAD_DIR = DATA_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload", response_model=KnowledgeItemOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    department: str = Form(...),
    tags: Optional[str] = Form(None),
    permission: str = Form("Public"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # 1. Save uploaded file to local disk
    file_path = UPLOAD_DIR / file.filename
    async with aiofiles.open(file_path, "wb") as out_file:
        content = await file.read()
        await out_file.write(content)

    # 2. Save KnowledgeItem record to DB
    db_item = KnowledgeItem(
        title=file.filename,
        type="file",
        file_path=str(file_path),
        department=department,
        tags=tags,
        owner_id=current_user.id,
        permission=permission,
        status="Approved"  # Employee uploads are approved by default
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    # Log Upload Action
    audit = AuditLog(
        user_id=current_user.id,
        action="DOC_UPLOAD",
        target_type="file",
        target_id=db_item.id,
        details=f"Uploaded file: {file.filename}"
    )
    db.add(audit)
    db.commit()

    # 3. Text Extraction
    _, ext = os.path.splitext(file.filename.lower())
    extracted_text = ""
    pages = [] # For PDFs
    
    if ext == ".pdf":
        pages = extract_text_from_pdf(str(file_path))
        extracted_text = "\n".join([text for _, text in pages])
    elif ext == ".docx":
        extracted_text = extract_text_from_docx(str(file_path))
    elif ext == ".pptx":
        extracted_text = extract_text_from_pptx(str(file_path))
    elif ext in [".txt", ".md", ".markdown"]:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            extracted_text = f.read()
    elif ext in [".html", ".htm"]:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            raw_html = f.read()
            extracted_text = extract_text_from_html(raw_html)
    else:
        # Fallback raw reading
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                extracted_text = f.read()
        except:
            raise HTTPException(status_code=400, detail="Unsupported file format")

    # 4. Clean text
    cleaned_txt = clean_text(extracted_text)
    
    # 5. Chunking & Embedding
    chunks = split_text_into_chunks(cleaned_txt)
    
    if chunks:
        # Embed all chunks
        embeddings = embedding_model.encode(chunks)
        faiss_ids = faiss_manager.add_vectors(embeddings)

        # Store chunk metadata in MySQL (DataBloom analysis)
        for i, chunk_content in enumerate(chunks):
            # Compute dynamic page numbers for PDF if available
            meta_json = {}
            if pages:
                # Find which page contains this chunk (fuzzy match)
                for page_num, p_text in pages:
                    if chunk_content[:100] in p_text:
                        meta_json["page"] = page_num
                        break
            
            meta_bloom = extract_metadata_from_chunk(chunk_content, file.filename)
            db_chunk = DocumentChunk(
                document_id=db_item.id,
                content=chunk_content,
                summary=meta_bloom["summary"],
                keywords=meta_bloom["keywords"],
                topic=meta_bloom["topic"] or department,
                named_entities=meta_bloom["named_entities"],
                faiss_id=faiss_ids[i],
                metadata_json=json.dumps(meta_json)
            )
            db.add(db_chunk)
        db.commit()

    return db_item

@router.post("/index-url", response_model=KnowledgeItemOut)
def index_url(
    url: str,
    title: str,
    department: str,
    tags: Optional[str] = None,
    permission: str = "Public",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    import requests
    try:
        r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
        if r.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to fetch URL. HTTP status {r.status_code}")
        
        raw_text = extract_text_from_html(r.text)
        cleaned = clean_text(raw_text)
        chunks = split_text_into_chunks(cleaned)
        
        # Save KnowledgeItem
        db_item = KnowledgeItem(
            title=title,
            type="web",
            source_url=url,
            department=department,
            tags=tags,
            owner_id=current_user.id,
            permission=permission,
            status="Approved"
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)

        audit = AuditLog(
            user_id=current_user.id,
            action="URL_INDEX",
            target_type="web",
            target_id=db_item.id,
            details=f"Indexed URL: {url}"
        )
        db.add(audit)
        db.commit()

        if chunks:
            embeddings = embedding_model.encode(chunks)
            faiss_ids = faiss_manager.add_vectors(embeddings)
            
            for i, chunk_content in enumerate(chunks):
                meta_bloom = extract_metadata_from_chunk(chunk_content, title)
                db_chunk = DocumentChunk(
                    document_id=db_item.id,
                    content=chunk_content,
                    summary=meta_bloom["summary"],
                    keywords=meta_bloom["keywords"],
                    topic=meta_bloom["topic"] or department,
                    named_entities=meta_bloom["named_entities"],
                    faiss_id=faiss_ids[i],
                    metadata_json=json.dumps({"url": url})
                )
                db.add(db_chunk)
            db.commit()
            
        return db_item
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Web URL crawling error: {e}")

@router.get("/list", response_model=List[KnowledgeItemOut])
def list_knowledge(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Standard employee list (can view Public and same department items)
    if current_user.role == "Admin":
        return db.query(KnowledgeItem).filter(KnowledgeItem.status == "Approved").all()
    else:
        return db.query(KnowledgeItem).filter(
            (KnowledgeItem.status == "Approved") & 
            (
                (KnowledgeItem.permission == "Public") | 
                ((KnowledgeItem.permission == "Department") & (KnowledgeItem.department == current_user.department))
            )
        ).all()

@router.get("/{doc_id}/chunks", response_model=List[DocumentChunkOut])
def get_document_chunks(doc_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Check permissions
    doc = db.query(KnowledgeItem).filter(KnowledgeItem.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if current_user.role != "Admin":
        if doc.permission == "Admin":
            raise HTTPException(status_code=403, detail="Forbidden")
        if doc.permission == "Department" and doc.department != current_user.department:
            raise HTTPException(status_code=403, detail="Forbidden")

    return db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).all()
