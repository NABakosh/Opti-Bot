from difflib import SequenceMatcher

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import KnowledgeBase
from app.schemas.knowledge_base import KnowledgeBaseCreate, KnowledgeBaseUpdate

MATCH_THRESHOLD = 0.6
CONTEXT_MIN_SCORE = 0.2
CONTEXT_LIMIT = 3


def _score(question: str, entry: KnowledgeBase) -> float:
    return SequenceMatcher(None, question.strip().lower(), entry.question.strip().lower()).ratio()


async def list_entries(db: AsyncSession) -> list[KnowledgeBase]:
    result = await db.execute(select(KnowledgeBase).order_by(KnowledgeBase.id))
    return list(result.scalars().all())


async def find_best_match(db: AsyncSession, question: str) -> KnowledgeBase | None:
    """Ищет похожий вопрос в базе знаний. Без embeddings — просто сравнение строк."""
    entries = await list_entries(db)
    if not entries:
        return None

    best_entry = max(entries, key=lambda entry: _score(question, entry))
    return best_entry if _score(question, best_entry) >= MATCH_THRESHOLD else None


async def top_matches(db: AsyncSession, question: str, limit: int = CONTEXT_LIMIT) -> list[KnowledgeBase]:
    """Топ-N похожих записей для RAG-контекста в промпте ИИ, даже если точного совпадения нет."""
    entries = await list_entries(db)
    scored = sorted(
        ((_score(question, entry), entry) for entry in entries),
        key=lambda pair: pair[0],
        reverse=True,
    )
    return [entry for score, entry in scored[:limit] if score >= CONTEXT_MIN_SCORE]


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
