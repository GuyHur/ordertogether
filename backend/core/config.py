"""Application settings loaded from environment variables / .env file."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    DATA_DIR: str = "./data"
    SQLITE_DB_NAME: str = "ordertogether.db"
    
    # Optional Postgres Connection
    POSTGRES_USER: str | None = None
    POSTGRES_PASSWORD: str | None = None
    POSTGRES_HOST: str | None = None
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str | None = None
    
    # Alternatively, supply a raw DATABASE_URL
    DATABASE_URL: str | None = None
    
    @property
    def get_database_url(self) -> str:
        # 1. Full URL overrides everything
        if self.DATABASE_URL:
            if self.DATABASE_URL.startswith("postgresql://"):
                return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
            return self.DATABASE_URL

        # 2. Reconstruct PostgreSQL URL from parts
        if self.POSTGRES_HOST and self.POSTGRES_DB:
            user = self.POSTGRES_USER or ""
            pwd = f":{self.POSTGRES_PASSWORD}" if self.POSTGRES_PASSWORD else ""
            cred = f"{user}{pwd}@" if user else ""
            return f"postgresql+asyncpg://{cred}{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            
        # 3. Fallback to SQLite file in DATA_DIR
        import os
        from pathlib import Path
        
        data_path = Path(self.DATA_DIR).resolve()
        os.makedirs(data_path, exist_ok=True)
        db_path = data_path / self.SQLITE_DB_NAME
        
        # SQLite absolute paths in SQLAlchemy use triple slashes and forward slashes
        abs_db_path = str(db_path).replace("\\", "/")
        return f"sqlite+aiosqlite:///{abs_db_path}"

    # JWT
    SECRET_KEY: str = "change-me-in-production-use-a-real-secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # App
    APP_NAME: str = "OrderTogether"
    DEBUG: bool = True

    # Preset buildings available for order targeting
    BUILDINGS: list[str] = [
        "Building A",
        "Building B",
        "Building C",
        "Main Office",
        "Warehouse",
    ]
    # LDAP (Windows domain / Active Directory)
    LDAP_ENABLED: bool = False
    LDAP_URL: str = "ldap://dc.company.com"
    LDAP_BASE_DN: str = "DC=company,DC=com"
    LDAP_BIND_DN: str = ""
    LDAP_BIND_PASSWORD: str = ""
    # Attribute(s) to match login: userPrincipalName (email) and/or sAMAccountName (Windows username)
    LDAP_USER_SEARCH_ATTRIBUTE: str = "userPrincipalName"
    # Optional second attribute so users can log in with email OR username (e.g. sAMAccountName)
    LDAP_USER_SEARCH_ATTRIBUTE_ALT: str = ""
    # Optional: restrict to a specific OU
    LDAP_USER_SEARCH_FILTER: str = "(objectClass=user)"
    
    # Superuser settings
    SUPERUSER_USERNAME: str | None = None
    LDAP_SUPERUSER_GROUP: str | None = None

    # Preset food tags for categorising orders
    FOOD_TAGS: list[str] = [
        "Pizza",
        "Sushi",
        "Burgers",
        "Asian",
        "Salads",
        "Breakfast",
        "Coffee",
        "Desserts",
        "Middle Eastern",
        "Mexican",
        "Italian",
        "Vegan",
    ]



settings = Settings()
