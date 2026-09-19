from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Green-API
    green_api_id_instance: str = ""
    green_api_token: str = ""
    test_phone_number: str = ""

    # Cerebras
    cerebras_api_key: str = ""

    # PostgreSQL
    database_url: str = ""

    # Redis
    redis_url: str = ""

    # Сервер
    port: int = 5000


settings = Settings()
