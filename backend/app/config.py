from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Supabase
    supabase_url: str
    supabase_service_role_key: str
    supabase_jwt_secret: str

    # OpenAI
    openai_api_key: str
    openai_vector_store_id: str = ""  # Created on first upload if empty

    # LangSmith
    langsmith_api_key: str = ""
    langsmith_project: str = "rangarok-rag-module-1"
    langsmith_tracing_v2: str = "true"

    # App
    frontend_origin: str = "http://localhost:5173"


settings = Settings()
