import os
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func

from ..database import get_db
from ..models import User, Session, Transaction, Supplier, Purchase, Sale, Investment
from ..schemas import (
    LoginRequest, RegisterRequest, TokenResponse, MeResponse,
    TransactionSchema, SupplierSchema, PurchaseSchema, SaleSchema, InvestmentSchema,
)
from ..auth import hash_password, verify_password, create_jwt, decode_jwt, get_current_user

router = APIRouter()
model_map = {
    "transactions": (Transaction, TransactionSchema),
    "suppliers": (Supplier, SupplierSchema),
    "purchases": (Purchase, PurchaseSchema),
    "sales": (Sale, SaleSchema),
    "investments": (Investment, InvestmentSchema),
}


@router.post("/api/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        return JSONResponse({"ok": False, "error": "Email ou senha inválidos"}, status_code=401)
    expired = user.expire_at and user.expire_at < datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if expired:
        return JSONResponse({"ok": False, "error": "Conta expirada"}, status_code=403)
    token = create_jwt({"sub": user.id, "email": user.email})
    db.add(Session(token=token, user_id=user.id))
    await db.commit()
    return TokenResponse(
        ok=True, token=token, name=user.name,
        premium=user.premium, is_admin=user.is_admin or False,
        expire_at=user.expire_at or "",
    )


@router.post("/api/register")
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        return JSONResponse({"ok": False, "error": "Email já cadastrado"}, status_code=400)
    if body.code != os.getenv("REGISTER_CODE", "admin2024"):
        return JSONResponse({"ok": False, "error": "Código de registro inválido"}, status_code=400)
    user = User(
        email=body.email, name=body.name,
        password_hash=hash_password(body.password),
        premium=True, is_admin=True,
    )
    db.add(user)
    await db.commit()
    token = create_jwt({"sub": user.id, "email": user.email})
    db.add(Session(token=token, user_id=user.id))
    await db.commit()
    return TokenResponse(
        ok=True, token=token, name=user.name,
        premium=True, is_admin=True, expire_at="",
    )


@router.get("/api/me")
async def me(request: Request, db: AsyncSession = Depends(get_db)):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return MeResponse(logged_in=False)
    payload = decode_jwt(auth[7:])
    if not payload:
        return MeResponse(logged_in=False)
    result = await db.execute(select(User).where(User.id == payload.get("sub")))
    user = result.scalar_one_or_none()
    if not user:
        return MeResponse(logged_in=False)
    expired = user.expire_at and user.expire_at < datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return MeResponse(
        logged_in=True, name=user.name, email=user.email,
        premium=user.premium, is_admin=user.is_admin or False,
        expire_at=user.expire_at or "", expired=bool(expired), demo=user.demo,
    )


@router.post("/api/logout")
async def logout(request: Request, db: AsyncSession = Depends(get_db)):
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        await db.execute(delete(Session).where(Session.token == auth[7:]))
        await db.commit()
    return {"ok": True}


@router.get("/api/data")
async def get_data(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.expire_at and user.expire_at < datetime.now(timezone.utc).strftime("%Y-%m-%d"):
        return JSONResponse({"ok": False, "error": "Conta expirada"}, status_code=403)
    result = {}
    for key, (model, _) in model_map.items():
        rows = await db.execute(select(model).where(model.user_id == user.id))
        items = rows.scalars().all()
        result[key] = [
            {k: v for k, v in item.__dict__.items() if not k.startswith("_")}
            for item in items
        ]
    result["ok"] = True
    return result


@router.post("/api/data/{collection}")
async def save_item(
    collection: str, body: dict,
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db),
):
    if collection not in model_map:
        raise HTTPException(status_code=404, detail="Collection not found")
    model, schema = model_map[collection]
    item_id = body.get("id")
    if item_id and item_id != "new":
        result = await db.execute(select(model).where(model.id == item_id, model.user_id == user.id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        for k, v in body.items():
            if k != "id" and hasattr(item, k):
                setattr(item, k, v)
    else:
        body.pop("id", None)
        body["user_id"] = user.id
        item = model(**body)
        db.add(item)
    await db.commit()
    return {"ok": True, "id": item.id if hasattr(item, "id") else None}


@router.delete("/api/data/{collection}/{item_id}")
async def delete_item(
    collection: str, item_id: str,
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db),
):
    if collection not in model_map:
        raise HTTPException(status_code=404, detail="Collection not found")
    model, _ = model_map[collection]
    result = await db.execute(select(model).where(model.id == item_id, model.user_id == user.id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(item)
    await db.commit()
    return {"ok": True}


@router.post("/api/import")
async def import_data(body: dict, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    for key, (model, _) in model_map.items():
        items = body.get(key, [])
        for item in items:
            item["user_id"] = user.id
            db.add(model(**item))
    await db.commit()
    return {"ok": True}


@router.post("/api/import-json")
async def import_json(body: dict, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    for key, (model, _) in model_map.items():
        items = body.get(key, [])
        for item in items:
            item["user_id"] = user.id
            db.add(model(**item))
    await db.commit()
    return {"ok": True}


@router.post("/api/me/update")
async def me_update(body: dict, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    for k, v in body.items():
        if k == "password" and v:
            setattr(user, "password_hash", hash_password(v))
        elif hasattr(user, k) and k not in ("id", "password_hash", "is_admin", "premium"):
            setattr(user, k, v)
    await db.commit()
    return {"ok": True, "message": "Perfil atualizado"}


@router.get("/api/admin/users")
async def admin_users(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.execute(select(User))
    users = result.scalars().all()
    return {"ok": True, "users": [
        {"id": u.id, "email": u.email, "name": u.name, "premium": u.premium,
         "is_admin": u.is_admin, "expire_at": u.expire_at or "", "demo": u.demo}
        for u in users
    ]}


@router.post("/api/admin/user/{user_id}")
async def admin_update_user(
    user_id: str, body: dict,
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db),
):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    for k, v in body.items():
        if hasattr(target, k) and k != "id" and k != "password_hash":
            setattr(target, k, v)
    await db.commit()
    return {"ok": True}


@router.delete("/api/admin/user/{user_id}")
async def admin_delete_user(
    user_id: str,
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db),
):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    await db.execute(delete(Session).where(Session.user_id == user_id))
    await db.execute(delete(Transaction).where(Transaction.user_id == user_id))
    await db.execute(delete(Supplier).where(Supplier.user_id == user_id))
    await db.execute(delete(Purchase).where(Purchase.user_id == user_id))
    await db.execute(delete(Sale).where(Sale.user_id == user_id))
    await db.execute(delete(Investment).where(Investment.user_id == user_id))
    await db.delete(target)
    await db.commit()
    return {"ok": True}
