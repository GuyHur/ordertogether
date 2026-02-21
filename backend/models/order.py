"""Order and OrderParticipant ORM models."""

import enum

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, TimestampMixin, UUIDMixin


class OrderStatus(str, enum.Enum):
    OPEN = "open"
    LOCKED = "locked"
    ORDERED = "ordered"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class Order(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "orders"

    creator_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    service_id: Mapped[str] = mapped_column(ForeignKey("delivery_services.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus), default=OrderStatus.OPEN, nullable=False
    )
    destination: Mapped[str | None] = mapped_column(String(200), nullable=True)
    order_link: Mapped[str | None] = mapped_column(String(500), nullable=True)
    deadline: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    creator = relationship("User", back_populates="created_orders", lazy="selectin")
    service = relationship("DeliveryService", lazy="selectin")
    participants = relationship(
        "OrderParticipant", back_populates="order", lazy="selectin", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Order {self.title} ({self.status})>"


class OrderParticipant(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "order_participants"

    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    items_summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    order = relationship("Order", back_populates="participants")
    user = relationship("User", back_populates="participations", lazy="selectin")

    def __repr__(self) -> str:
        return f"<OrderParticipant order={self.order_id} user={self.user_id}>"
