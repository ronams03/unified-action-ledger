from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional


class Settings(BaseSettings):
	app_name: str = Field(default="Unified Action Ledger")
	secret_key: str = Field(default="change-this-secret")
	access_token_expire_minutes: int = Field(default=60 * 24)
	database_url: str = Field(default="sqlite+aiosqlite:///./ual.db")
	enable_docs: bool = Field(default=True)
	environment: str = Field(default="dev")
	scheduler_timezone: str = Field(default="UTC")

	class Config:
		env_file = ".env"
		env_file_encoding = "utf-8"


settings = Settings()