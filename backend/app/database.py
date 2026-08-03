from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text

from .config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        from . import models
        await conn.run_sync(models.Base.metadata.create_all)
    try:
        await _migrate()
    except Exception as e:
        print(f"[migrate] error: {e}")


MIGRATIONS = {
    "suppliers": {
        "products": "TEXT DEFAULT ''",
        "rating": "TEXT DEFAULT ''",
    },
    "investments": {
        "grupo": "TEXT DEFAULT 'Nacional'",
        "data_atualizacao": "TEXT DEFAULT ''",
        "pct_cdi": "TEXT DEFAULT ''",
    },
}


async def _migrate():
    async with engine.begin() as conn:
        for table, columns in MIGRATIONS.items():
            result = await conn.execute(text(f"PRAGMA table_info({table})"))
            existing = {row[1] for row in result.fetchall()}
            for col, col_type in columns.items():
                if col not in existing:
                    try:
                        await conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"))
                        print(f"[migrate] added column {table}.{col}")
                    except Exception:
                        pass
