"""Receipt ORM model — receipt image uploads for orders."""

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, TimestampMixin, UUIDMixin


class Receipt(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "receipts"

    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    ocr_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    user = relationship("User", lazy="selectin")
