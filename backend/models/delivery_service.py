"""DeliveryService ORM model."""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class DeliveryService(Base):
    __tablename__ = "delivery_services"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    name_he: Mapped[str | None] = mapped_column(String(100), nullable=True)
    icon_url: Mapped[str] = mapped_column(String(255), nullable=False)
    site_url: Mapped[str] = mapped_column(String(255), nullable=False)

    def __repr__(self) -> str:
        return f"<DeliveryService {self.id}>"
