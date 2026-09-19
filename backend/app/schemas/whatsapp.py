from typing import Optional

from pydantic import BaseModel


class SenderData(BaseModel):
    chatId: str
    sender: str
    senderName: Optional[str] = None


class TextMessageData(BaseModel):
    textMessage: str


class ExtendedTextMessageData(BaseModel):
    text: str


class MessageData(BaseModel):
    typeMessage: str
    textMessageData: Optional[TextMessageData] = None
    extendedTextMessageData: Optional[ExtendedTextMessageData] = None

    @property
    def text(self) -> Optional[str]:
        if self.textMessageData:
            return self.textMessageData.textMessage
        if self.extendedTextMessageData:
            return self.extendedTextMessageData.text
        return None


class IncomingMessageNotification(BaseModel):
    typeWebhook: str
    idMessage: Optional[str] = None
    senderData: Optional[SenderData] = None
    messageData: Optional[MessageData] = None
