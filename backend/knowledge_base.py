"""
Phase 3 (extension) - Knowledge Base (Tools & Safety Guidelines)
GET /{id} automatically logs a "recent view" (deduped — updates timestamp if
already viewed). POST /recent is also exposed for the frontend to call
explicitly (e.g. after playing an embedded video) — both write to the same
KnowledgeRecentView table.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from knowledge_base_models import KnowledgeArticle, KnowledgeBookmark, KnowledgeRecentView
from technician_models import Technician
from technician_auth import get_current_technician
from datetime import datetime

router = APIRouter(prefix="/api/knowledge-base", tags=["Knowledge Base"])


class RecentViewCreate(BaseModel):
    article_id: int


def _log_recent_view(db: Session, technician_id: int, article_id: int):
    existing = db.query(KnowledgeRecentView).filter(
        KnowledgeRecentView.technician_id == technician_id,
        KnowledgeRecentView.article_id == article_id
    ).first()
    if existing:
        existing.viewed_at = datetime.utcnow()
    else:
        db.add(KnowledgeRecentView(technician_id=technician_id, article_id=article_id))
    db.commit()


@router.get("")
def list_articles(
    category: str = None,
    db: Session = Depends(get_db),
    current_technician: Technician = Depends(get_current_technician)
):
    query = db.query(KnowledgeArticle)
    if category:
        query = query.filter(KnowledgeArticle.category == category)
    articles = query.order_by(KnowledgeArticle.created_at.desc()).all()
    return {
        "success": True,
        "articles": [
            {"id": a.id, "title": a.title, "category": a.category, "created_at": a.created_at.isoformat()}
            for a in articles
        ]
    }


@router.get("/categories")
def list_categories(db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    categories = db.query(KnowledgeArticle.category).distinct().all()
    return {"success": True, "categories": [c[0] for c in categories]}


@router.get("/search")
def search_articles(q: str, db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    if not q or len(q.strip()) < 2:
        raise HTTPException(status_code=400, detail="Search query must be at least 2 characters.")
    like_pattern = f"%{q}%"
    articles = db.query(KnowledgeArticle).filter(
        (KnowledgeArticle.title.ilike(like_pattern)) | (KnowledgeArticle.content.ilike(like_pattern))
    ).all()
    return {
        "success": True,
        "results": [{"id": a.id, "title": a.title, "category": a.category} for a in articles]
    }


@router.get("/bookmarks")
def get_bookmarks(db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    bookmarks = db.query(KnowledgeBookmark).filter(KnowledgeBookmark.technician_id == current_technician.id).all()
    result = []
    for b in bookmarks:
        article = db.query(KnowledgeArticle).filter(KnowledgeArticle.id == b.article_id).first()
        if article:
            result.append({"id": article.id, "title": article.title, "category": article.category})
    return {"success": True, "bookmarks": result}


@router.get("/recent")
def get_recent(db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    views = db.query(KnowledgeRecentView).filter(
        KnowledgeRecentView.technician_id == current_technician.id
    ).order_by(KnowledgeRecentView.viewed_at.desc()).limit(10).all()
    result = []
    for v in views:
        article = db.query(KnowledgeArticle).filter(KnowledgeArticle.id == v.article_id).first()
        if article:
            result.append({"id": article.id, "title": article.title, "category": article.category,
                           "viewed_at": v.viewed_at.isoformat()})
    return {"success": True, "recent": result}


@router.post("/recent")
def mark_recent(data: RecentViewCreate, db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    article = db.query(KnowledgeArticle).filter(KnowledgeArticle.id == data.article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found.")
    _log_recent_view(db, current_technician.id, data.article_id)
    return {"success": True, "message": "Marked as recently viewed."}


@router.post("/bookmark/{article_id}")
def toggle_bookmark(article_id: int, db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    article = db.query(KnowledgeArticle).filter(KnowledgeArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found.")

    existing = db.query(KnowledgeBookmark).filter(
        KnowledgeBookmark.technician_id == current_technician.id,
        KnowledgeBookmark.article_id == article_id
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"success": True, "bookmarked": False, "message": "Bookmark removed."}
    else:
        db.add(KnowledgeBookmark(technician_id=current_technician.id, article_id=article_id))
        db.commit()
        return {"success": True, "bookmarked": True, "message": "Article bookmarked."}


@router.get("/{article_id}")
def get_article(article_id: int, db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    article = db.query(KnowledgeArticle).filter(KnowledgeArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found.")

    _log_recent_view(db, current_technician.id, article_id)

    is_bookmarked = db.query(KnowledgeBookmark).filter(
        KnowledgeBookmark.technician_id == current_technician.id,
        KnowledgeBookmark.article_id == article_id
    ).first() is not None

    return {
        "success": True,
        "article": {
            "id": article.id,
            "title": article.title,
            "category": article.category,
            "content": article.content,
            "created_at": article.created_at.isoformat(),
            "is_bookmarked": is_bookmarked
        }
    }