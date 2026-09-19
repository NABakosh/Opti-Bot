from datetime import datetime

from pydantic import BaseModel, ConfigDict


class KnowledgeBaseBase(BaseModel):
    question: str
    answer: str


class KnowledgeBaseCreate(KnowledgeBaseBase):
    pass


class KnowledgeBaseUpdate(BaseModel):
    question: str | None = None
    answer: str | None = None


class KnowledgeBaseOut(KnowledgeBaseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
