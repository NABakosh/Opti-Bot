from fastapi import FastAPI
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.redis import redis_client
from app.db.session import engine

app = FastAPI(title="Opti-Bot API")

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.get("/health/deps")
async def health_deps() -> dict:
    status = {"database": "unknown", "redis": "unknown"}

    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        status["database"] = "ok"
    except Exception as exc:
        status["database"] = f"error: {exc}"

    try:
        await redis_client.ping()
        status["redis"] = "ok"
    except Exception as exc:
        status["redis"] = f"error: {exc}"

    return status
