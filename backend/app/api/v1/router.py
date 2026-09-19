from fastapi import APIRouter

from app.api.v1.endpoints import conversations, knowledge_base, whatsapp

api_router = APIRouter()

api_router.include_router(whatsapp.router, prefix="/whatsapp", tags=["whatsapp"])
api_router.include_router(knowledge_base.router, prefix="/knowledge-base", tags=["knowledge-base"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
