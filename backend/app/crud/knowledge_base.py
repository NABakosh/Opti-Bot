from difflib import SequenceMatcher

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import KnowledgeBase
from app.schemas.knowledge_base import KnowledgeBaseCreate, KnowledgeBaseUpdate

MATCH_THRESHOLD = 0.6


async def list_entries(db: AsyncSession) -> list[KnowledgeBase]:
    result = await db.execute(select(KnowledgeBase).order_by(KnowledgeBase.id))
    return list(result.scalars().all())


async def find_best_match(db: AsyncSession, question: str) -> KnowledgeBase | None:
    """Ищет похожий вопрос в базе знаний. Без embeddings — просто сравнение строк."""
    entries = await list_entries(db)
    if not entries:
        return None

    normalized = question.strip().lower()
    best_entry = None
    best_score = 0.0

    for entry in entries:
        score = SequenceMatcher(None, normalized, entry.question.strip().lower()).ratio()
        if score > best_score:
            best_score = score
            best_entry = entry

    return best_entry if best_score >= MATCH_THRESHOLD else None


async def get_entry(db: AsyncSession, entry_id: int) -> KnowledgeBase | None:
    return await db.get(KnowledgeBase, entry_id)


async def create_entry(db: AsyncSession, data: KnowledgeBaseCreate) -> KnowledgeBase:
    entry = KnowledgeBase(question=data.question, answer=data.answer)
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


async def update_entry(db: AsyncSession, entry: KnowledgeBase, data: KnowledgeBaseUpdate) -> KnowledgeBase:
    if data.question is not None:
        entry.question = data.question
    if data.answer is not None:
        entry.answer = data.answer
    await db.commit()
    await db.refresh(entry)
    return entry


async def delete_entry(db: AsyncSession, entry: KnowledgeBase) -> None:
    await db.delete(entry)
    await db.commit()
