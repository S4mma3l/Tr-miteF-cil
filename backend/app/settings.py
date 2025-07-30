# backend/app/settings.py

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Gestiona las variables de entorno para la conexión con el cliente de Supabase.
    """
    SUPABASE_URL: str
    SUPABASE_KEY: str # Aquí irá la service_role key
    SENDGRID_API_KEY: str # Nueva variable para SendGrid

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()