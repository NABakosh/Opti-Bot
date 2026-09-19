from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.crud import knowledge_base as crud
from app.schemas.knowledge_base import KnowledgeBaseCreate, KnowledgeBaseOut, KnowledgeBaseUpdate

router = APIRouter()


@router.get("/", response_model=list[KnowledgeBaseOut])
async def list_knowledge_base(db: AsyncSession = Depends(get_db)):
    return await crud.list_entries(db)


@router.post("/", response_model=KnowledgeBaseOut, status_code=201)
async def create_knowledge_base_entry(data: KnowledgeBaseCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_entry(db, data)


@router.get("/{entry_id}", response_model=KnowledgeBaseOut)
async def get_knowledge_base_entry(entry_id: int, db: AsyncSession = Depends(get_db)):
    entry = await crud.get_entry(db, entry_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Not found")
    return entry


@router.put("/{entry_id}", response_model=KnowledgeBaseOut)
async def update_knowledge_base_entry(
    entry_id: int, data: KnowledgeBaseUpdate, db: AsyncSession = Depends(get_db)
):
    entry = await crud.get_entry(db, entry_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Not found")
    return await crud.update_entry(db, entry, data)


@router.delete("/{entry_id}", status_code=204)
async def delete_knowledge_base_entry(entry_id: int, db: AsyncSession = Depends(get_db)):
    entry = await crud.get_entry(db, entry_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Not found")
    await crud.delete_entry(db, entry)
