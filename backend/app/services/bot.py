from app.services.cerebras import cerebras_client
from app.services.green_api import green_api_client

SYSTEM_PROMPT = "Ты — ассистент, который отвечает пользователям в WhatsApp. Отвечай кратко и по делу."


async def generate_reply(user_message: str) -> str:
    response = await cerebras_client.chat(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ]
    )
    return response["choices"][0]["message"]["content"]


async def handle_incoming_text(chat_id: str, text: str) -> str:
    reply = await generate_reply(text)
    await green_api_client.send_message(chat_id, reply)
    return reply
