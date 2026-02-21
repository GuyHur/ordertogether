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
    DATABASE_URL: str = "sqlite+aiosqlite:///./ordertogether.db"

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
