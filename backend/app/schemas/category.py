from pydantic import BaseModel


class CategoryBase(BaseModel):
    name: str
    color: str | None = None
    icon: str | None = None
    description: str | None = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = None
    color: str | None = None
    icon: str | None = None
    description: str | None = None


class Category(CategoryBase):
    id: str
    createdAt: str
