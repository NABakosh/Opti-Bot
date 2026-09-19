from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.crud import conversation as crud
from app.schemas.conversation import ConversationDetail, ConversationOut, OperatorReplyIn
from app.services.green_api import green_api_client

router = APIRouter()


@router.get("/", response_model=list[ConversationOut])
async def list_conversations(db: AsyncSession = Depends(get_db)):
    return await crud.list_conversations(db)


@router.get("/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(conversation_id: int, db: AsyncSession = Depends(get_db)):
    conversation = await crud.get_conversation_with_messages(db, conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Not found")
    return conversation


@router.post("/{conversation_id}/reply", response_model=ConversationDetail)
async def reply_as_operator(
    conversation_id: int, data: OperatorReplyIn, db: AsyncSession = Depends(get_db)
):
    conversation = await crud.get_conversation_with_messages(db, conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Not found")

    await green_api_client.send_message(conversation.chat_id, data.text)
    await crud.add_message(db, conversation, sender="operator", text=data.text)
    return await crud.get_conversation_with_messages(db, conversation_id)


@router.post("/{conversation_id}/escalate", response_model=ConversationOut)
async def escalate_conversation(conversation_id: int, db: AsyncSession = Depends(get_db)):
    """Оператор вручную берёт диалог — бот перестаёт отвечать в нём."""
    conversation = await crud.get_conversation_with_messages(db, conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Not found")
    return await crud.set_escalated(db, conversation, True)


@router.post("/{conversation_id}/resolve", response_model=ConversationOut)
async def resolve_conversation(conversation_id: int, db: AsyncSession = Depends(get_db)):
    """Снимает эскалацию — бот снова отвечает автоматически."""
    conversation = await crud.get_conversation_with_messages(db, conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Not found")
    return await crud.set_escalated(db, conversation, False)
