import os
import re
import json
import logging
from typing import List, Dict, Any, Tuple
import numpy as np
import faiss
from pypdf import PdfReader
from docx import Document as DocxDocument
from pptx import Presentation as PptxPresentation
from bs4 import BeautifulSoup

from app.config import FAISS_INDEX_PATH, EMBEDDING_MODEL_NAME, CHUNK_SIZE, CHUNK_OVERLAP

logger = logging.getLogger(__name__)

# --- Robust Embedding Model Wrapper ---
class NexusEmbeddingModel:
    def __init__(self):
        self.model = None
        self.dimension = 384
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading sentence-transformer model: {EMBEDDING_MODEL_NAME}")
            self.model = SentenceTransformer(EMBEDDING_MODEL_NAME)
            self.dimension = self.model.get_sentence_embedding_dimension()
            logger.info(f"Model loaded successfully. Dimension: {self.dimension}")
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformer: {e}. Falling back to Mock Embeddings (dim: {self.dimension})")

    def encode(self, texts: List[str]) -> np.ndarray:
        if self.model:
            embeddings = self.model.encode(texts, convert_to_numpy=True)
            return embeddings.astype('float32')
        else:
            # Deterministic mock embedding generator for offline/fallback mode
            # Generates vectors of size 384 based on word hashes
            embeddings_list = []
            for text in texts:
                vec = np.zeros(self.dimension, dtype='float32')
                words = re.findall(r'\w+', text.lower())
                if words:
                    for i, word in enumerate(words):
                        # Use hash of word to select index and add value
                        h = hash(word)
                        idx = abs(h) % self.dimension
                        vec[idx] += 1.0 + (i % 3)
                    # Normalize vector to unit length
                    norm = np.linalg.norm(vec)
                    if norm > 0:
                        vec = vec / norm
                else:
                    # Random/deterministic vector for empty chunks
                    vec[0] = 1.0
                embeddings_list.append(vec)
            return np.array(embeddings_list, dtype='float32')

# Global single instance of embedding model
embedding_model = NexusEmbeddingModel()

# --- FAISS Vector Database Wrapper ---
class FAISSIndexManager:
    def __init__(self, path: str = FAISS_INDEX_PATH, dimension: int = 384):
        self.path = path
        self.dimension = dimension
        self.index = None
        self._initialize_index()

    def _initialize_index(self):
        index_file = os.path.join(self.path, "index.faiss")
        if os.path.exists(index_file):
            try:
                self.index = faiss.read_index(index_file)
                logger.info(f"Loaded existing FAISS index from {index_file} with {self.index.ntotal} vectors.")
                return
            except Exception as e:
                logger.error(f"Error reading FAISS index: {e}. Recreating...")
        
        # Create folder if it doesn't exist
        os.makedirs(self.path, exist_ok=True)
        # Using IndexFlatIP for cosine similarity (Inner Product on normalized vectors)
        self.index = faiss.IndexFlatIP(self.dimension)
        logger.info(f"Initialized new empty FAISS index (dimension: {self.dimension})")
        self.save()

    def save(self):
        try:
            index_file = os.path.join(self.path, "index.faiss")
            faiss.write_index(self.index, index_file)
            logger.info(f"FAISS index saved to {index_file}. Total vectors: {self.index.ntotal}")
        except Exception as e:
            logger.error(f"Error saving FAISS index: {e}")

    def add_vectors(self, vectors: np.ndarray) -> List[int]:
        # Normalize vectors for Cosine Similarity (since we are using IndexFlatIP)
        faiss.normalize_L2(vectors)
        start_id = self.index.ntotal
        self.index.add(vectors)
        self.save()
        return list(range(start_id, self.index.ntotal))

    def search(self, query_vector: np.ndarray, k: int = 5) -> Tuple[np.ndarray, np.ndarray]:
        # Normalize query vector
        faiss.normalize_L2(query_vector)
        distances, indices = self.index.search(query_vector, k)
        return distances[0], indices[0]

# Global single instance of FAISS Index
faiss_manager = FAISSIndexManager(dimension=embedding_model.dimension)

# --- Text Parsers ---
def extract_text_from_pdf(file_path: str) -> List[Tuple[int, str]]:
    """Extracts text page by page from PDF. Returns list of tuples (page_num, text)."""
    pages = []
    try:
        reader = PdfReader(file_path)
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                pages.append((i + 1, text))
    except Exception as e:
        logger.error(f"Error reading PDF {file_path}: {e}")
    return pages

def extract_text_from_docx(file_path: str) -> str:
    """Extracts text from DOCX."""
    try:
        doc = DocxDocument(file_path)
        return "\n".join([para.text for para in doc.paragraphs])
    except Exception as e:
        logger.error(f"Error reading DOCX {file_path}: {e}")
        return ""

def extract_text_from_pptx(file_path: str) -> str:
    """Extracts text from PPTX slides."""
    try:
        prs = PptxPresentation(file_path)
        text_runs = []
        for slide_idx, slide in enumerate(prs.slides):
            for shape in slide.shapes:
                if hasattr(shape, "text") and shape.text:
                    text_runs.append(shape.text)
        return "\n".join(text_runs)
    except Exception as e:
        logger.error(f"Error reading PPTX {file_path}: {e}")
        return ""

def extract_text_from_html(html_content: str) -> str:
    """Extracts plain text from HTML content."""
    try:
        soup = BeautifulSoup(html_content, "html.parser")
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        return soup.get_text(separator="\n")
    except Exception as e:
        logger.error(f"Error parsing HTML: {e}")
        return html_content

def clean_text(text: str) -> str:
    """Cleans text: removes multiple whitespaces, standardizes newlines, strips non-printable characters."""
    if not text:
        return ""
    text = re.sub(r'[\r\n]+', '\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'[^\x20-\x7E\n]', '', text)  # Strip control characters
    return text.strip()

# --- Semantic Chunking ---
def split_text_into_chunks(text: str, chunk_size: int = CHUNK_SIZE, chunk_overlap: int = CHUNK_OVERLAP) -> List[str]:
    """Splits clean text recursively based on double newlines, single newlines, spaces."""
    if not text:
        return []
    
    # Simple recursive-like text splitter logic
    separators = ["\n\n", "\n", " ", ""]
    chunks = []
    
    # We will do a character-level moving-window split as a robust implementation
    current_idx = 0
    total_len = len(text)
    
    while current_idx < total_len:
        # Define end index
        end_idx = min(current_idx + chunk_size, total_len)
        
        # If we are not at the end, try to find a natural boundary
        if end_idx < total_len:
            # Look backwards for separators to make a cleaner break
            found_boundary = False
            for sep in separators[:3]:
                last_sep = text.rfind(sep, current_idx, end_idx)
                if last_sep != -1 and last_sep > current_idx + (chunk_size // 2):
                    end_idx = last_sep + len(sep)
                    found_boundary = True
                    break
        
        chunk = text[current_idx:end_idx].strip()
        if chunk:
            chunks.append(chunk)
        
        current_idx = end_idx - chunk_overlap if end_idx < total_len else total_len
        if current_idx >= total_len or chunk_overlap >= chunk_size:
            break
            
    return chunks

# --- Metadata Extraction Engine (DataBloom) ---
def extract_metadata_from_chunk(chunk: str, doc_title: str) -> Dict[str, Any]:
    """Generates Topic classification, Summary, Keywords, and Named Entities from a text chunk."""
    # 1. Clean chunk
    clean_c = chunk.strip()
    
    # 2. Extract Keywords
    # Filter common stopwords and select top frequent nouns/adjectives
    stopwords = {"the", "a", "an", "and", "or", "but", "if", "then", "else", "to", "in", "on", "at", "for", "with", "is", "are", "was", "were", "be", "been", "this", "that", "it", "of", "from", "by", "as", "about"}
    words = re.findall(r'\b[a-zA-Z]{4,15}\b', clean_c.lower())
    filtered_words = [w for w in words if w not in stopwords]
    
    # Keyword counts
    kw_counts = {}
    for w in filtered_words:
        kw_counts[w] = kw_counts.get(w, 0) + 1
    sorted_kws = sorted(kw_counts.items(), key=lambda x: x[1], reverse=True)
    keywords = [kw[0] for kw in sorted_kws[:6]]
    
    # 3. Dynamic Topic Classification
    # Guess topic based on keyword matching
    topics_dict = {
        "Engineering": ["code", "api", "database", "git", "function", "deploy", "server", "docker", "implement", "jwt"],
        "HR": ["leave", "policy", "onboarding", "recruit", "holiday", "employee", "salary", "talent", "manager"],
        "Finance": ["invoice", "budget", "billing", "payment", "revenue", "cost", "salary", "audit", "expense"],
        "Operations": ["process", "support", "workflow", "system", "schedule", "office", "equipment", "logistics"]
    }
    
    topic_scores = {topic: 0 for topic in topics_dict}
    for word in words:
        for topic, terms in topics_dict.items():
            if word in terms:
                topic_scores[topic] += 1
                
    max_topic = max(topic_scores, key=topic_scores.get)
    if topic_scores[max_topic] == 0:
        topic = "General Knowledge"
    else:
        topic = max_topic

    # 4. Extract Named Entities
    # Look for patterns starting with capital letters (excluding start of sentences)
    entities = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', chunk)
    # Filter unique and remove start words that are not entities
    unique_entities = list(set(entities))
    filtered_entities = [e for e in unique_entities if e.lower() not in stopwords and len(e) > 2]
    
    # 5. Extract/Generate Summary
    # Extract first sentence or first 120 chars as summary
    sentences = re.split(r'(?<=[.!?])\s+', clean_c)
    summary = sentences[0] if sentences else clean_c[:120]
    if len(summary) > 150:
        summary = summary[:147] + "..."
        
    return {
        "summary": summary,
        "keywords": ", ".join(keywords),
        "topic": topic,
        "named_entities": ", ".join(filtered_entities[:8])
    }
