"""Import existing data from old JSON files into the new database."""
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import init_db, async_session
from app.models import User, Transaction, Supplier, Purchase, Sale, Investment
import bcrypt


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


COLLECTION_MAP = {
    "transactions": Transaction,
    "suppliers": Supplier,
    "purchases": Purchase,
    "sales": Sale,
    "investments": Investment,
}

MODEL_DEFAULTS = {
    "category": "Outro", "name": "", "description": "",
    "supplier": "", "contact": "", "payment": "Pix",
    "ticker": "", "broker": "", "operation": "compra",
    "date": "", "value": "0", "qty": "0", "avg_price": "0",
    "current_price": "0", "type": "receita",
    "cnpj": "", "phone": "", "email": "",
}


def filename_to_email(name: str) -> str:
    return name.replace("_at_", "@").replace(".json", "")


async def import_all(data_dir: str, users_file: str):
    with open(users_file) as f:
        users_data = json.load(f).get("users", [])

    # Map email -> user info
    user_map = {}
    for u in users_data:
        email = u.get("email", "").lower()
        if email:
            user_map[email] = u

    await init_db()

    async with async_session() as db:
        for json_path in sorted(Path(data_dir).glob("*.json")):
            email = filename_to_email(json_path.name).lower()
            user_info = user_map.get(email, {})

            with open(json_path) as f:
                data = json.load(f)

            if not data:
                continue

            password = user_info.get("password", "admin")
            if user_info.get("password_hash"):
                password = "admin"

            user = User(
                email=email,
                name=user_info.get("name", email.split("@")[0]),
                password_hash=hash_password(password),
                premium=user_info.get("premium", False),
                is_admin=user_info.get("isAdmin", False),
                expire_at=user_info.get("expire_at", ""),
                demo=user_info.get("isDemo", False),
            )
            db.add(user)
            await db.flush()

            total = 0
            for key, model in COLLECTION_MAP.items():
                model_cols = {c.name for c in model.__table__.columns}
                items = data.get(key, [])
                for item in items:
                    obj = {"user_id": user.id}
                    for col in model_cols:
                        if col == "id":
                            continue
                        elif col in item and item[col] is not None:
                            obj[col] = item[col]
                        elif col in MODEL_DEFAULTS:
                            obj[col] = MODEL_DEFAULTS[col]
                    db.add(model(**obj))
                    total += 1

            print(f"  {json_path.name}: {total} records for {email}")

        await db.commit()
        print(f"Done! Imported {len(list(Path(data_dir).glob('*.json')))} users")


async def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("data_dir", nargs="?",
                        default=str(Path(__file__).parent.parent.parent / "userdata"))
    parser.add_argument("--users", default=None,
                        help="Path to users.json")
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    if not data_dir.exists():
        print(f"Directory {data_dir} not found")
        return

    users_file = args.users or str(data_dir.parent / "users.json")
    if not Path(users_file).exists():
        users_file = str(Path(__file__).parent.parent.parent / "users.json")

    print(f"Importing from {data_dir}")
    print(f"Users file: {users_file}")
    await import_all(str(data_dir), users_file)


if __name__ == "__main__":
    asyncio.run(main())
