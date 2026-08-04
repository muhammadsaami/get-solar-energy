"""
Phase 3 (extension) - Knowledge Base (Tools & Safety Guidelines)
Content itself (articles) will need to be seeded by an admin — this module
is empty until articles are added, same as training_modules was until seeded.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from database import Base
from datetime import datetime


class KnowledgeArticle(Base):
    __tablename__ = "knowledge_articles"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False, index=True)   # e.g. "Safety", "Tools", "Troubleshooting"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class KnowledgeBookmark(Base):
    __tablename__ = "knowledge_bookmarks"
    id = Column(Integer, primary_key=True, index=True)
    technician_id = Column(Integer, ForeignKey("technicians.id"), nullable=False)
    article_id = Column(Integer, ForeignKey("knowledge_articles.id"), nullable=False)
    bookmarked_at = Column(DateTime, default=datetime.utcnow)


class KnowledgeRecentView(Base):
    __tablename__ = "knowledge_recent_views"
    id = Column(Integer, primary_key=True, index=True)
    technician_id = Column(Integer, ForeignKey("technicians.id"), nullable=False)
    article_id = Column(Integer, ForeignKey("knowledge_articles.id"), nullable=False)
    viewed_at = Column(DateTime, default=datetime.utcnow)