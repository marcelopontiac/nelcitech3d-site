import os
import asyncio
import httpx
from datetime import datetime, date
from zoneinfo import ZoneInfo
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from contextlib import asynccontextmanager
from sqlalchemy import select

from .database import init_db, get_db
from .routes import router
from .auth import get_current_user
from .models import User, Investment, Transaction
from .config import settings

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "frontend", "dist")

BRT = ZoneInfo("America/Sao_Paulo")
UPDATE_LOCK = asyncio.Lock()
last_update_file = "/tmp/nelci_price_update.txt"

def _resolve_yf_ticker(ticker: str, category: str = "") -> str:
    t = ticker.strip().upper()
    if t.endswith(".SA") or "." in t:
        return t
    if category == "Internacional" or category.endswith(" Intl"):
        return t
    if t and t[-1].isdigit():
        return f"{t}.SA"
    return t


def get_last_update_date():
    try:
        with open(last_update_file) as f:
            return f.read().strip()
    except:
        return ""

def set_last_update_date(d: str):
    with open(last_update_file, "w") as f:
        f.write(d)

async def background_price_updater():
    while True:
        try:
            now_brt = datetime.now(BRT)
            is_weekday = now_brt.weekday() < 5
            is_after_close = now_brt.hour >= 18
            today = now_brt.strftime("%Y-%m-%d")
            already_run = get_last_update_date() == today

            if is_weekday and is_after_close and not already_run:
                async with UPDATE_LOCK:
                    try:
                        from sqlalchemy.ext.asyncio import AsyncSession
                        from .database import async_session
                        async with async_session() as db:
                            result = await db.execute(select(Investment).where(Investment.ticker != ""))
                            rows = result.scalars().all()
                            tickers_seen = {}
                            for inv in rows:
                                tk = inv.ticker.strip().upper()
                                if tk and tk not in tickers_seen:
                                    yf_tk = _resolve_yf_ticker(tk, inv.category)
                                    tickers_seen[tk] = {"ticker": tk, "yf": yf_tk}
                            yf_map = {v["yf"]: v["ticker"] for v in tickers_seen.values()}
                            if yf_map:
                                prices = await fetch_yfinance_prices(list(yf_map.keys()))
                                updated = 0
                                for yf_tk, price in prices.items():
                                    orig_tk = yf_map.get(yf_tk)
                                    if orig_tk and price:
                                        r2 = await db.execute(
                                            select(Investment).where(Investment.ticker == orig_tk)
                                        )
                                        for inv in r2.scalars():
                                            inv.current_price = str(round(float(price), 2))
                                            updated += 1
                                await db.commit()
                        set_last_update_date(today)
                    except Exception as e:
                        print(f"[auto-update] error: {e}")
        except Exception as e:
            print(f"[auto-update] loop error: {e}")
        await asyncio.sleep(1800)


async def fetch_yfinance_prices(tickers: list[str]) -> dict[str, float]:
    import yfinance as yf
    loop = asyncio.get_event_loop()
    result = {}
    for t in tickers:
        try:
            tk = yf.Ticker(t)
            hist = await loop.run_in_executor(None, lambda tk=tk: tk.history(period="1d"))
            if not hist.empty:
                result[t] = float(hist["Close"].iloc[-1])
        except:
            pass
    return result


async def fetch_cdi_accumulated(start_date: str) -> float:
    """Fetch CDI accumulated factor from BCB API between start_date and today."""
    try:
        url = f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?dataInicial={start_date}&dataFinal=31/12/2099&formato=json"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=15)
            if resp.status_code != 200:
                return 0
            data = resp.json()
            if not data:
                return 0
            factor = 1.0
            for item in data:
                daily_rate = float(item.get("valor", 0))
                factor *= (1 + daily_rate / 100)
            return factor
    except:
        return 0


async def fetch_cdi_current() -> dict:
    """Fetch current CDI annual rate from BCB."""
    try:
        url = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=10)
            if resp.status_code != 200:
                return {"rate": 0, "date": ""}
            data = resp.json()
            if not data:
                return {"rate": 0, "date": ""}
            daily = float(data[0].get("valor", 0))
            annual = ((1 + daily / 100) ** 252 - 1) * 100
            return {"rate": round(annual, 2), "daily_rate": daily, "date": data[0].get("data", "")}
    except:
        return {"rate": 0, "date": ""}


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    task = asyncio.create_task(background_price_updater())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(lifespan=lifespan, title="NelciTech3D API", version="1.0")

@app.middleware("http")
async def add_cache_headers(request, call_next):
    response = await call_next(request)
    path = request.url.path
    if path.startswith("/assets/"):
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    elif path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    else:
        response.headers["Cache-Control"] = "no-cache"
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/api/stocks/{ticker}")
async def stock_price(ticker: str, category: str = "", user: User = Depends(get_current_user)):
    import yfinance as yf
    try:
        yf_ticker = _resolve_yf_ticker(ticker, category)
        tk = yf.Ticker(yf_ticker)
        hist = tk.history(period="1d")
        price = float(hist["Close"].iloc[-1]) if not hist.empty else 0
        info = tk.info
        return {
            "ok": True,
            "ticker": ticker.upper(),
            "price": price,
            "change": info.get("regularMarketChange", 0),
            "changePercent": info.get("regularMarketChangePercent", 0),
            "name": info.get("longName", info.get("shortName", ticker.upper())),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stocks/{ticker}/history")
async def stock_history(ticker: str, period: str = "3mo", category: str = "", user: User = Depends(get_current_user)):
    import yfinance as yf
    try:
        yf_ticker = _resolve_yf_ticker(ticker, category)
        tk = yf.Ticker(yf_ticker)
        hist = tk.history(period=period)
        if hist.empty:
            return {"ok": True, "ticker": ticker.upper(), "data": []}
        data = []
        for idx, row in hist.iterrows():
            data.append({
                "date": idx.strftime("%Y-%m-%d"),
                "close": round(float(row["Close"]), 2),
                "volume": int(row.get("Volume", 0)),
            })
        return {"ok": True, "ticker": ticker.upper(), "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/cdi")
async def cdi_rate(user: User = Depends(get_current_user)):
    return await fetch_cdi_current()


@app.post("/api/investments/refresh-prices")
async def refresh_prices(user: User = Depends(get_current_user), db=Depends(get_db)):
    result = await db.execute(
        select(Investment).where(Investment.user_id == user.id)
    )
    investments = result.scalars().all()
    if not investments:
        return {"ok": True, "updated": 0, "message": "Nenhum investimento encontrado"}

    cdi_cats = {"CDB", "Renda Fixa"}
    updated = 0

    # Separate: yfinance tickers vs CDI-based
    yf_invs = []
    cdi_invs = []
    for inv in investments:
        tk = (inv.ticker or "").strip().upper()
        if inv.category in cdi_cats:
            cdi_invs.append(inv)
        elif tk:
            yf_invs.append(inv)

    # Fetch yfinance prices
    seen = {}
    for inv in yf_invs:
        tk = inv.ticker.strip().upper()
        if tk and tk not in seen:
            yf_tk = _resolve_yf_ticker(tk, inv.category)
            seen[tk] = {"orig": tk, "yf": yf_tk}

    yf_to_orig = {v["yf"]: v["orig"] for v in seen.values()}
    prices = await fetch_yfinance_prices(list(yf_to_orig.keys()))
    for yf_tk, price in prices.items():
        orig_tk = yf_to_orig.get(yf_tk)
        if orig_tk and price:
            for inv in yf_invs:
                if inv.ticker.strip().upper() == orig_tk:
                    inv.current_price = str(round(float(price), 2))
                    updated += 1

    # Calculate CDI-based prices
    for inv in cdi_invs:
        try:
            principal = float(inv.avg_price) or 0
            if principal <= 0:
                continue
            inv_date = (inv.date or "").strip()
            if not inv_date:
                continue
            d = datetime.strptime(inv_date, "%Y-%m-%d")
            start_bcb = d.strftime("%d/%m/%Y")
            cdi_factor = await fetch_cdi_accumulated(start_bcb)
            if cdi_factor > 1:
                pct = float(inv.pct_cdi or "100") / 100
                valor_atual = principal * (1 + (cdi_factor - 1) * pct)
                inv.current_price = str(round(valor_atual, 2))
                updated += 1
        except:
            pass

    await db.commit()
    return {"ok": True, "updated": updated, "time": datetime.now(BRT).isoformat()}


@app.post("/api/ai/chat")
async def ai_chat(body: dict, user: User = Depends(get_current_user), db=Depends(get_db)):
    api_key = body.get("api_key", "")
    if not api_key:
        raise HTTPException(status_code=400, detail="API Key necessária")

    message = body.get("message", "")
    if not message:
        raise HTTPException(status_code=400, detail="Mensagem vazia")

    # Coletar dados financeiros do usuário para contexto
    tx_result = await db.execute(select(Transaction).where(Transaction.user_id == user.id))
    transactions = tx_result.scalars().all()
    inv_result = await db.execute(select(Investment).where(Investment.user_id == user.id))
    investments = inv_result.scalars().all()

    rec = sum((float(t.value) or 0) for t in transactions if (t.type or "").lower() == "receita")
    desp = sum((float(t.value) or 0) for t in transactions if (t.type or "").lower() == "despesa")
    saldo = rec - desp
    total_inv = sum((float(i.avg_price) or 0) * (float(i.qty) or 0) for i in investments)
    total_atual = sum((float(i.current_price) or float(i.avg_price) or 0) * (float(i.qty) or 0) for i in investments)

    tx_summary = f"Receitas: R$ {rec:.2f} | Despesas: R$ {desp:.2f} | Saldo: R$ {saldo:.2f} | Transações: {len(transactions)}"
    inv_summary = f"Investido: R$ {total_inv:.2f} | Valor Atual: R$ {total_atual:.2f} | Lucro: R$ {total_atual - total_inv:.2f} | Ativos: {len(investments)}"

    inv_list = "; ".join([f"{i.ticker or i.name} ({i.category}): {i.qty}x R${i.avg_price}" for i in investments[:20]])

    system_prompt = (
        "Você é um assistente financeiro brasileiro chamado 'Nelci IA'. "
        "Responda em português brasileiro de forma clara e objetiva. "
        "Analise os dados financeiros e dê conselhos práticos.\n\n"
        f"DADOS DO USUÁRIO:\n{tx_summary}\n{inv_summary}\n"
        f"CARTEIRA: {inv_list}"
    )

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": message},
                    ],
                    "max_tokens": 800,
                    "temperature": 0.7,
                },
                timeout=30,
            )
            if resp.status_code != 200:
                error_detail = resp.text[:200]
                raise HTTPException(status_code=resp.status_code, detail=f"DeepSeek API error: {error_detail}")

            data = resp.json()
            reply = data.get("choices", [{}])[0].get("message", {}).get("content", "Sem resposta")

            return {"ok": True, "reply": reply}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro: {str(e)}")


@app.get("/api/system/restart")
async def system_restart(user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    import subprocess
    try:
        subprocess.Popen(
            ["systemd-run", "--uid=root", "--wait", "--pipe", "reboot"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            start_new_session=True,
        )
        return {"ok": True, "message": "Sistema reiniciando..."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


import psutil

@app.get("/api/system/stats")
async def system_stats():
    cpu_percent = psutil.cpu_percent(interval=0.5)
    cpu_per_core = psutil.cpu_percent(interval=0, percpu=True)
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    net = psutil.net_io_counters()
    boot = psutil.boot_time()
    uptime_seconds = int(datetime.now().timestamp() - boot)
    days, rem = divmod(uptime_seconds, 86400)
    hours, rem = divmod(rem, 3600)
    minutes = rem // 60
    return {
        "cpu": {"percent": cpu_percent, "per_core": cpu_per_core, "cores": len(cpu_per_core)},
        "memory": {"total": mem.total, "available": mem.available, "used": mem.used, "percent": mem.percent},
        "disk": {"total": disk.total, "used": disk.used, "free": disk.free, "percent": disk.percent},
        "uptime": f"{days}d {hours}h {minutes}m",
        "uptime_seconds": uptime_seconds,
        "network": {"bytes_sent": net.bytes_sent, "bytes_recv": net.bytes_recv},
        "python": {"cpu_percent": psutil.Process().cpu_percent(interval=0.1), "memory_percent": psutil.Process().memory_percent(), "memory_rss": psutil.Process().memory_info().rss},
    }


@app.get("/api/system/firewall")
async def system_firewall():
    import subprocess
    rules = []
    config_raw = ""
    try:
        result = subprocess.run(["nft", "--json", "list", "ruleset"], capture_output=True, text=True, timeout=5)
        if result.returncode == 0 and result.stdout:
            import json as _json
            data = _json.loads(result.stdout)
            for entry in data.get("nftables", []):
                if "rule" in entry:
                    r = entry["rule"]
                    expr = r.get("expr", [])
                    dest = ""
                    for e in expr:
                        if isinstance(e, dict) and "match" in e:
                            m = e["match"]
                            if m.get("op", "") == "==":
                                left = m.get("left", {})
                                right = m.get("right", "")
                                if isinstance(left, dict) and left.get("type") in ("ip daddr", "ip6 daddr", "daddr"):
                                    dest = str(right)
                    rules.append({
                        "family": r.get("family", ""),
                        "table": r.get("table", ""),
                        "chain": r.get("chain", ""),
                        "dest": dest,
                        "expr": str(expr),
                    })
    except:
        pass
    try:
        with open("/etc/nftables.conf") as f:
            config_raw = f.read()
    except:
        pass
    return {"rules": rules, "config_raw": config_raw}


if os.path.isdir(FRONTEND_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(FRONTEND_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8080, reload=True)
