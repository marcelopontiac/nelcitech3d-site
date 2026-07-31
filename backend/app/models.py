import uuid
from datetime import datetime
from sqlalchemy import String, Float, Boolean, DateTime, Text, JSON, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.sqlite import TEXT as SQLITE_TEXT

from .database import Base


def gen_id() -> str:
    return str(uuid.uuid4())[:8]


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)
    password_hash: Mapped[str] = mapped_column(String)
    premium: Mapped[bool] = mapped_column(Boolean, default=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    expire_at: Mapped[str | None] = mapped_column(String, nullable=True)
    demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Session(Base):
    __tablename__ = "sessions"
    token: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Transaction(Base):
    __tablename__ = "transactions"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    user_id: Mapped[str] = mapped_column(String, index=True)
    date: Mapped[str] = mapped_column(String)
    type: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String)
    category: Mapped[str] = mapped_column(String)
    value: Mapped[str] = mapped_column(String)


class Supplier(Base):
    __tablename__ = "suppliers"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    user_id: Mapped[str] = mapped_column(String, index=True)
    name: Mapped[str] = mapped_column(String)
    contact: Mapped[str] = mapped_column(String, default="")
    cnpj: Mapped[str] = mapped_column(String, default="")
    phone: Mapped[str] = mapped_column(String, default="")
    email: Mapped[str] = mapped_column(String, default="")
    products: Mapped[str] = mapped_column(String, default="")
    rating: Mapped[str] = mapped_column(String, default="")


class Purchase(Base):
    __tablename__ = "purchases"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    user_id: Mapped[str] = mapped_column(String, index=True)
    date: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String)
    supplier: Mapped[str] = mapped_column(String, default="")
    category: Mapped[str] = mapped_column(String)
    payment: Mapped[str] = mapped_column(String)
    value: Mapped[str] = mapped_column(String)


class Sale(Base):
    __tablename__ = "sales"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    user_id: Mapped[str] = mapped_column(String, index=True)
    date: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String)
    category: Mapped[str] = mapped_column(String)
    payment: Mapped[str] = mapped_column(String)
    value: Mapped[str] = mapped_column(String)


class Investment(Base):
    __tablename__ = "investments"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    user_id: Mapped[str] = mapped_column(String, index=True)
    category: Mapped[str] = mapped_column(String, default="Ações")
    grupo: Mapped[str] = mapped_column(String, default="Nacional")
    ticker: Mapped[str] = mapped_column(String, default="")
    name: Mapped[str] = mapped_column(String, default="")
    broker: Mapped[str] = mapped_column(String, default="")
    operation: Mapped[str] = mapped_column(String, default="compra")
    qty: Mapped[str] = mapped_column(String)
    avg_price: Mapped[str] = mapped_column(String)
    current_price: Mapped[str] = mapped_column(String, default="")
    pct_cdi: Mapped[str] = mapped_column(String, default="")
    date: Mapped[str] = mapped_column(String)
    data_atualizacao: Mapped[str] = mapped_column(String, default="")
