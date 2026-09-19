from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Green-API
    green_api_id_instance: str = ""
    green_api_token: str = ""
    test_phone_number: str = ""

    # Номер оператора для уведомлений об эскалации (формат: код страны + номер + @c.us)
    operator_chat_id: str = ""

    # Номера, с которыми боту разрешено переписываться (через запятую, формат "...@c.us").
    # Пусто = отвечает всем. Нужно из-за лимита Green-API на бесплатном тарифе (3 корреспондента
    # в месяц) — чтобы не тратить попытки/токены на номера, которым всё равно не сможем ответить.
    allowed_chat_ids: str = ""

    # Cerebras
    cerebras_api_key: str = ""

    # PostgreSQL
    database_url: str = ""

    # Redis
    redis_url: str = ""

    # Сервер
    port: int = 5000


settings = Settings()
