import json
import logging
import time
from typing import List, Dict, Any, Tuple
import numpy as np
from sqlalchemy.orm import Session
from rank_bm25 import BM25Okapi

from app.models import DocumentChunk, KnowledgeItem, SearchLog
from app.pipeline import embedding_model, faiss_manager
from app.config import OPENAI_API_KEY

logger = logging.getLogger(__name__)

def tokenize(text: str) -> List[str]:
    return [w.lower() for w in re.findall(r'\b\w{3,15}\b', text)]

import re

# Reciprocal Rank Fusion (RRF) implementation for Hybrid Search merging
def reciprocal_rank_fusion(
    vector_results: List[Tuple[DocumentChunk, float]], 
    keyword_results: List[Tuple[DocumentChunk, float]], 
    k_rrf: int = 60
) -> List[Tuple[DocumentChunk, float]]:
    """Merges two ranked lists using Reciprocal Rank Fusion (RRF)."""
    scores = {}
    
    # Vector ranks
    for rank, (chunk, score) in enumerate(vector_results):
        scores[chunk.id] = scores.get(chunk.id, 0.0) + (1.0 / (k_rrf + rank + 1))
        
    # Keyword ranks
    for rank, (chunk, score) in enumerate(keyword_results):
        scores[chunk.id] = scores.get(chunk.id, 0.0) + (1.0 / (k_rrf + rank + 1))
        
    # Sort chunks by fusion score
    sorted_chunk_ids = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    
    # Rebuild merged list
    id_to_chunk = {c.id: c for c, _ in vector_results + keyword_results}
    merged_results = []
    for chunk_id, fusion_score in sorted_chunk_ids:
        merged_results.append((id_to_chunk[chunk_id], fusion_score))
        
    return merged_results

def run_hybrid_search(query: str, db: Session, limit: int = 5) -> List[Dict[str, Any]]:
    """Runs FAISS semantic vector search + BM25 keyword search, merging results."""
    # 1. Check if there are chunks in the database
    total_chunks = db.query(DocumentChunk).count()
    if total_chunks == 0:
        return []

    # --- 2. Semantic Search (FAISS) ---
    query_vector = embedding_model.encode([query])
    distances, indices = faiss_manager.search(query_vector, k=min(30, total_chunks))
    
    vector_results = []
    for idx, dist in zip(indices, distances):
        if idx == -1:
            continue
        chunk = db.query(DocumentChunk).filter(DocumentChunk.faiss_id == int(idx)).first()
        if chunk:
            vector_results.append((chunk, float(dist)))

    # --- 3. Keyword Search (BM25) ---
    # Retrieve candidates from database to compile BM25 index on-the-fly
    # To be fast, fetch chunks containing words from the query or just retrieve the latest 100 chunks
    candidates = db.query(DocumentChunk).order_by(DocumentChunk.id.desc()).limit(100).all()
    
    keyword_results = []
    if candidates:
        tokenized_corpus = [tokenize(c.content) for c in candidates]
        bm25 = BM25Okapi(tokenized_corpus)
        query_tokens = tokenize(query)
        
        bm25_scores = bm25.get_scores(query_tokens)
        scored_candidates = list(zip(candidates, bm25_scores))
        # Filter candidates with > 0 score and sort
        scored_candidates = [item for item in scored_candidates if item[1] > 0]
        scored_candidates.sort(key=lambda x: x[1], reverse=True)
        
        for chunk, score in scored_candidates[:30]:
            keyword_results.append((chunk, float(score)))

    # --- 4. Merge Results using RRF ---
    # If no keyword results, fall back directly to vector results
    if not keyword_results:
        merged = vector_results[:limit]
    elif not vector_results:
        merged = keyword_results[:limit]
    else:
        merged = reciprocal_rank_fusion(vector_results, keyword_results)[:limit]

    # --- 5. Format results with source file details ---
    formatted_results = []
    for chunk, score in merged:
        doc = db.query(KnowledgeItem).filter(KnowledgeItem.id == chunk.document_id).first()
        doc_title = doc.title if doc else "Unknown Document"
        doc_type = doc.type if doc else "file"
        source_url = doc.source_url if doc else None
        file_path = doc.file_path if doc else None
        
        # Load meta
        meta_info = {}
        if chunk.metadata_json:
            try:
                meta_info = json.loads(chunk.metadata_json)
            except:
                pass
                
        # Calculate individual confidence score
        # Cosine distance ranges from -1 to 1. In IndexFlatIP it maps to cosine similarity.
        # We normalize to a 0.0 - 1.0 confidence score
        confidence = 0.5
        # If chunk is from vector search, we can use its vector score
        vec_score = next((v_score for v_chunk, v_score in vector_results if v_chunk.id == chunk.id), None)
        if vec_score is not None:
            confidence = float(np.clip((vec_score + 1.0) / 2.0, 0.0, 1.0))
        elif keyword_results:
            # Normalize keyword scores
            kw_score = next((k_score for k_chunk, k_score in keyword_results if k_chunk.id == chunk.id), 0.0)
            max_kw = max(s for _, s in keyword_results) if keyword_results else 1.0
            if max_kw > 0:
                confidence = 0.5 + (kw_score / max_kw) * 0.4

        formatted_results.append({
            "chunk_id": chunk.id,
            "document_id": chunk.document_id,
            "title": doc_title,
            "type": doc_type,
            "source_url": source_url,
            "file_path": meta_info.get("file_path", file_path),
            "chunk_content": chunk.content,
            "confidence": confidence,
            "meta": meta_info
        })
        
    return formatted_results

def generate_ai_answer(query: str, citations: List[Dict[str, Any]]) -> Tuple[str, float, List[str]]:
    """Synthesizes RAG responses using either OpenAI API or a smart local synthesis model."""
    if not citations:
        return "I'm sorry, I couldn't find any relevant documents in the knowledge base to answer your question.", 0.0, []

    # Compute overall confidence score
    avg_confidence = sum(c["confidence"] for c in citations) / len(citations)
    
    # Suggested follow-up questions generator
    suggested_questions = [
        f"Can you explain more about {citations[0]['title']}?",
        "Where is this documentation configured?",
        "What are the best practices for implementing this system?"
    ]

    # Check if OpenAI API Key is configured
    if OPENAI_API_KEY:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=OPENAI_API_KEY)
            
            # Format context
            context_blocks = []
            for i, c in enumerate(citations):
                src = c['file_path'] if c['file_path'] else c['source_url'] if c['source_url'] else c['title']
                context_blocks.append(f"Source [{i+1}] ({src}):\n{c['chunk_content']}")
            
            context_str = "\n\n".join(context_blocks)
            
            system_prompt = (
                "You are NexusQuery AI, an enterprise knowledge discovery assistant. "
                "Synthesize a highly professional, accurate, and comprehensive answer to the user query based ONLY on the source context provided below. "
                "You must cite your sources inside the text using bracket format like [1], [2], corresponding to the source index list. "
                "If the context doesn't contain information to answer, state that you cannot find it in the current indexed records."
            )
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Context:\n{context_str}\n\nQuery: {query}"}
                ],
                temperature=0.2
            )
            answer = response.choices[0].message.content
            return answer, avg_confidence, suggested_questions
        except Exception as e:
            logger.error(f"OpenAI completion error: {e}. Falling back to local generation...")

    # --- High-Fidelity Local Context Synthesizer (Fallback Mode) ---
    # Intelligently compiles extracts, highlights matching sentences, and formats clear inline references.
    logger.info("Using local synthesis fallback logic.")
    
    # Structure answer template
    answer_blocks = []
    
    # Highlight query terms inside chunks
    query_terms = tokenize(query)
    
    # Synthesize answers page-by-page/source-by-source
    for idx, cit in enumerate(citations):
        src_name = cit['file_path'] if cit['file_path'] else cit['source_url'] if cit['source_url'] else cit['title']
        content = cit['chunk_content']
        
        # Split into sentences to find the most relevant sentences matching query tokens
        sentences = re.split(r'(?<=[.!?])\s+', content)
        relevant_sentences = []
        for s in sentences:
            s_tokens = tokenize(s)
            overlap = set(query_terms).intersection(set(s_tokens))
            if overlap:
                relevant_sentences.append(s.strip())
                
        # If no sentences overlapped, take the first two sentences
        if not relevant_sentences:
            relevant_sentences = [s.strip() for s in sentences[:2]]
            
        summary_sentence = " ".join(relevant_sentences[:3])
        answer_blocks.append(f"According to **{src_name}**, {summary_sentence} [{idx+1}].")
        
    # Compile a cohesive summary paragraph
    synthesis = "\n\n".join(answer_blocks)
    
    # Add a concluding sentence summarizing the knowledge found
    synthesis += f"\n\nBased on your query, I found {len(citations)} relevant references in our database. The top matches belong to the **{citations[0]['title']}** resource, showing a confidence score of {int(avg_confidence * 100)}%."

    return synthesis, avg_confidence, suggested_questions

def log_search(user_id: int, query: str, answer: str, response_time_ms: int, confidence: float, failed: bool, db: Session):
    try:
        log = SearchLog(
            user_id=user_id,
            query=query,
            answer=answer,
            response_time_ms=response_time_ms,
            confidence_score=confidence,
            failed_search=failed
        )
        db.add(log)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to log search query: {e}")
