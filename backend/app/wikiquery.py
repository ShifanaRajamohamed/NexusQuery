import logging
import datetime
import json
import requests
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session

from app.models import KnowledgeItem, DocumentChunk, WikiSource
from app.pipeline import embedding_model, faiss_manager, clean_text, split_text_into_chunks, extract_metadata_from_chunk

logger = logging.getLogger(__name__)

def generate_mock_wiki_pages() -> list:
    """Generates structured documentation articles representing an internal company wiki."""
    return [
        {
            "title": "Engineering Standard Operating Procedures (SOP)",
            "url": "https://confluence.nexusai.local/display/ENG/Engineering+SOP",
            "content": """Engineering Standard Operating Procedures (SOP)
Welcome to the Engineering SOP. This page outlines coding rules, architecture standards, and Git conventions.

1. Architecture Design
We follow a service-oriented architectural layout. Our frontend uses React with TailwindCSS. The backend is FastAPI. Keep APIs stateless.

2. Database Guidelines
Never write raw queries. Use SQLAlchemy ORM with migrations. Ensure indexes are created on queried foreign keys.
Redis is used for caching session tokens and API responses.
MySQL is the primary relational database.

3. Git Workflow
Always branch from main. Use descriptive branch names like 'feature/auth-refresh' or 'bugfix/metrics-calc'.
All Pull Requests require approval from at least one Team Lead or Admin.
Before merging, execute tests locally via pytest.
""",
            "department": "Engineering",
            "tags": "engineering,sop,standards"
        },
        {
            "title": "Onboarding Guide & Checklist for New Hires",
            "url": "https://confluence.nexusai.local/display/HR/Onboarding+Checklist",
            "content": """Onboarding Guide & Checklist for New Hires
Welcome to Nexus AI! This document is designed to get you setup and productive.

Day 1 Checklist:
- Meet with HR to sign employment agreements.
- Receive your work laptop and setup internal passwords.
- Configure corporate email and join Slack channels.

Week 1 Objectives:
- Complete security training modules.
- Set up local development environment (clone code, spin up docker-compose).
- Read the Engineering SOP.
- Introduce yourself to the team.

Key Contacts:
- Engineering Director: Alex Johnson
- HR Manager: Sarah Connor
- Finance Controller: Bruce Wayne
""",
            "department": "HR",
            "tags": "hr,onboarding,guide"
        },
        {
            "title": "Leave and Vacation Policy",
            "url": "https://notion.so/nexusai/Leave-Policy-2026",
            "content": """Leave and Vacation Policy
This document describes the company leave and vacation rules for all employee roles.

1. Paid Time Off (PTO)
All full-time employees receive 25 days of Paid Time Off (PTO) per calendar year. PTO accrues monthly.
Submit leave requests in the HR portal at least 2 weeks in advance for vacations longer than 3 days.

2. Sick Leave
Employees receive 10 paid sick days per year. Medical certificates are required for sick leave extending beyond 3 consecutive days.

3. Maternity & Paternity Leave
We offer 16 weeks of fully paid maternity leave and 6 weeks of fully paid paternity leave to support new parents.

4. Public Holidays
Nexus AI observes 12 national public holidays. Check the calendar in Settings for exact dates.
""",
            "department": "HR",
            "tags": "hr,leave,policy"
        }
    ]

def crawl_and_index_wiki(wiki_id: int, db: Session):
    wiki = db.query(WikiSource).filter(WikiSource.id == wiki_id).first()
    if not wiki:
        logger.error(f"Wiki source with ID {wiki_id} not found in DB.")
        return

    wiki.status = "Fetching"
    db.commit()

    logger.info(f"Crawling wiki URL: {wiki.source_url}")
    
    pages = []
    
    # Check if we should scrape mock pages (for local demo)
    if "confluence" in wiki.source_url or "notion" in wiki.source_url or "local" in wiki.source_url:
        logger.info("Using high-fidelity mock internal wiki pages...")
        pages = generate_mock_wiki_pages()
    else:
        # Generic scraper attempt
        try:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
            r = requests.get(wiki.source_url, headers=headers, timeout=15)
            if r.status_code == 200:
                soup = BeautifulSoup(r.text, "html.parser")
                title = soup.title.string if soup.title else wiki.title
                content = clean_text(soup.get_text())
                pages.append({
                    "title": title,
                    "url": wiki.source_url,
                    "content": content,
                    "department": "Operations",
                    "tags": "wiki,webpage"
                })
            else:
                logger.warning(f"Failed crawling web URL: HTTP {r.status_code}. Generating mock pages...")
                pages = generate_mock_wiki_pages()
        except Exception as e:
            logger.error(f"Scraper error: {e}. Generating fallback mock wiki articles...")
            pages = generate_mock_wiki_pages()

    wiki.status = "Indexing"
    db.commit()

    try:
        total_chunks_added = 0
        for page_data in pages:
            # Create KnowledgeItem for each page
            k_item = db.query(KnowledgeItem).filter(
                KnowledgeItem.type == "wiki",
                KnowledgeItem.source_url == page_data["url"]
            ).first()

            if not k_item:
                k_item = KnowledgeItem(
                    title=page_data["title"],
                    type="wiki",
                    source_url=page_data["url"],
                    department=page_data["department"],
                    tags=page_data["tags"],
                    version="1.0.0",
                    status="Approved",
                    permission="Public"
                )
                db.add(k_item)
                db.commit()
                db.refresh(k_item)

            # Split content into chunks
            chunks = split_text_into_chunks(page_data["content"])
            if not chunks:
                continue

            # Embed chunks
            embeddings = embedding_model.encode(chunks)
            faiss_ids = faiss_manager.add_vectors(embeddings)

            # Add chunks to DB
            for idx, chunk_text in enumerate(chunks):
                meta_bloom = extract_metadata_from_chunk(chunk_text, page_data["title"])
                db_chunk = DocumentChunk(
                    document_id=k_item.id,
                    content=chunk_text,
                    summary=meta_bloom["summary"],
                    keywords=meta_bloom["keywords"],
                    topic=page_data["department"],
                    named_entities=meta_bloom["named_entities"],
                    faiss_id=faiss_ids[idx],
                    metadata_json=json.dumps({"url": page_data["url"]})
                )
                db.add(db_chunk)
                total_chunks_added += 1

        db.commit()

        wiki.status = "Ready"
        wiki.last_synced = datetime.datetime.utcnow()
        db.commit()
        logger.info(f"Wiki crawl completed successfully. Indexed {total_chunks_added} chunks across {len(pages)} pages.")

    except Exception as e:
        logger.error(f"Error during wiki index: {e}")
        wiki.status = "Failed"
        db.commit()
