import os
import sys
import time
import requests

# Set backend server base URL (assumes running locally)
BASE_URL = "http://localhost:8000"

def run_tests():
    print("---------------------------------------------")
    print("NexusQuery AI: Backend API Validation Suite")
    print("---------------------------------------------")
    
    # 1. Ping Backend status
    try:
        r = requests.get(f"{BASE_URL}/")
        if r.status_code == 200:
            print("[OK] API Gateway status check: ONLINE")
        else:
            print(f"[FAIL] API Gateway check: FAILED (status code: {r.status_code})")
            return
    except Exception as e:
        print(f"[FAIL] Could not connect to API server at {BASE_URL}. Ensure it is running. Error: {e}")
        return

    # 2. Register a new user
    username = f"tester_{int(time.time())}"
    email = f"{username}@nexusquery.ai"
    reg_payload = {
        "username": username,
        "email": email,
        "password": "testpassword123",
        "role": "Admin",
        "department": "Engineering"
    }
    
    try:
        r = requests.post(f"{BASE_URL}/api/auth/register", json=reg_payload)
        if r.status_code == 201:
            print(f"[OK] User Registration: SUCCESS (username: {username})")
        else:
            print(f"[FAIL] User Registration: FAILED ({r.text})")
            return
    except Exception as e:
        print(f"[FAIL] Registration request exception: {e}")
        return

    # 3. Log in user
    login_payload = {
        "username_or_email": email,
        "password": "testpassword123"
    }
    token = None
    try:
        r = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        if r.status_code == 200:
            token = r.json().get("access_token")
            print("[OK] User Authentication & JWT Issuance: SUCCESS")
        else:
            print(f"[FAIL] User Authentication: FAILED ({r.text})")
            return
    except Exception as e:
        print(f"[FAIL] Login request exception: {e}")
        return

    # Header auth
    headers = {"Authorization": f"Bearer {token}"}

    # 4. Profile validation
    try:
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        if r.status_code == 200 and r.json().get("email") == email:
            print("[OK] User Profile retrieval (RBAC check): SUCCESS")
        else:
            print(f"[FAIL] User Profile check: FAILED ({r.text})")
            return
    except Exception as e:
        print(f"[FAIL] Profile retrieval exception: {e}")
        return

    # 5. Index Web URL / Crawling Check
    url_payload = {
        "url": "https://example.com",
        "title": "Example Standard website",
        "department": "Operations",
        "tags": "example,webpage",
        "permission": "Public"
    }
    try:
        r = requests.post(
            f"{BASE_URL}/api/knowledge/index-url", 
            headers=headers,
            params=url_payload
        )
        if r.status_code == 200:
            doc_id = r.json().get("id")
            print(f"[OK] URL Scraper & AI Embedding Pipeline: SUCCESS (Doc ID: {doc_id})")
        else:
            print(f"[FAIL] URL indexing: FAILED ({r.text})")
            return
    except Exception as e:
        print(f"[FAIL] URL indexing exception: {e}")
        return

    # 6. Run Search query
    search_payload = {
        "query": "What is example domain?"
    }
    try:
        r = requests.post(
            f"{BASE_URL}/api/chat/query",
            headers=headers,
            json=search_payload
        )
        if r.status_code == 200:
            res = r.json()
            citations_count = len(res.get("citations", []))
            print(f"[OK] Hybrid Search Engine (BM25 + FAISS Vector): SUCCESS (Citations matches: {citations_count})")
            print(f"  Confidence Score: {int(res.get('confidence_score', 0) * 100)}%")
            print(f"  AI Citations-backed Answer preview:\n  > {res.get('answer')[:120]}...")
        else:
            print(f"[FAIL] Hybrid search query: FAILED ({r.text})")
            return
    except Exception as e:
        print(f"[FAIL] Hybrid search exception: {e}")
        return

    print("---------------------------------------------")
    print("[OK] ALL AI PIPELINE AND AUTH API TESTS PASSED SUCCESSFULLY!")
    print("---------------------------------------------")

if __name__ == "__main__":
    run_tests()
