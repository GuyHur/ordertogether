from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="OrderTogether API")

icons_dir = Path(__file__).parent / "static" / "icons"
app.mount("/api/icons", StaticFiles(directory=str(icons_dir)), name="icons")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DeliveryService(BaseModel):
    id: str
    name: str
    name_he: str | None
    icon_url: str
    site_url: str


@app.get("/api/services", response_model=list[DeliveryService])
async def get_services():
    """Return the delivery services shown on the OrderTogether page."""
    return [
        DeliveryService(
            id="wolt",
            name="Wolt",
            name_he=None,
            icon_url="/api/icons/wolt.svg",
            site_url="https://wolt.com/he/isr",
        ),
        DeliveryService(
            id="tenbis",
            name="Tenbis",
            name_he="תן ביס",
            icon_url="/api/icons/tenbis.svg",
            site_url="https://www.10bis.co.il",
        ),
        DeliveryService(
            id="mishloha",
            name="Mishloha",
            name_he="משלוחה",
            icon_url="/api/icons/mishloha.svg",
            site_url="https://mishloha.co.il",
        ),
    ]
