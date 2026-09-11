from pydantic import BaseModel


class AppUserBase(BaseModel):
    name: str
    username: str
    email: str
    phone: str = ""
    role: str = "Cashier"


class AppUserCreate(AppUserBase):
    permissions: list[str] = []


class AppUserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    role: str | None = None


class AppUserStatusUpdate(BaseModel):
    status: str


class AppUser(AppUserBase):
    id: str
    status: str = "Active"
    lastActive: str = ""


class AppUserListResponse(BaseModel):
    items: list[AppUser]
    total: int
