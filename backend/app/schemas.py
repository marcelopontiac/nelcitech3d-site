from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    code: str = ""


class TokenResponse(BaseModel):
    ok: bool
    token: str
    name: str
    premium: bool
    is_admin: bool = False
    expire_at: str = ""


class MeResponse(BaseModel):
    logged_in: bool
    name: str = ""
    email: str = ""
    premium: bool = False
    is_admin: bool = False
    expire_at: str = ""
    expired: bool = False
    demo: bool = False


class DataItem(BaseModel):
    id: str | None = None


class TransactionSchema(DataItem):
    date: str = ""
    type: str = ""
    description: str = ""
    category: str = ""
    value: str = ""


class SupplierSchema(DataItem):
    name: str = ""
    contact: str = ""
    cnpj: str = ""
    phone: str = ""
    email: str = ""
    products: str = ""
    rating: str = ""


class PurchaseSchema(DataItem):
    date: str = ""
    description: str = ""
    supplier: str = ""
    category: str = ""
    payment: str = ""
    value: str = ""


class SaleSchema(DataItem):
    date: str = ""
    description: str = ""
    category: str = ""
    payment: str = ""
    value: str = ""


class InvestmentSchema(DataItem):
    category: str = ""
    grupo: str = "Nacional"
    ticker: str = ""
    name: str = ""
    broker: str = ""
    operation: str = "compra"
    qty: str = ""
    avg_price: str = ""
    current_price: str = ""
    pct_cdi: str = ""
    date: str = ""
    data_atualizacao: str = ""
    intl_sub: str = ""


class DataResponse(BaseModel):
    transactions: list[TransactionSchema] = []
    suppliers: list[SupplierSchema] = []
    purchases: list[PurchaseSchema] = []
    sales: list[SaleSchema] = []
    investments: list[InvestmentSchema] = []
