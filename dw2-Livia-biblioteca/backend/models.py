from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.orm import declarative_base
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Suporte condicional a ConfigDict (pydantic v2) será tratado dinamicamente abaixo

Base = declarative_base()

# SQLAlchemy model
class Livro(Base):
    __tablename__ = "livros"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(90), unique=True, nullable=False)
    autor = Column(String, nullable=False)
    ano = Column(Integer, nullable=False)
    genero = Column(String)
    isbn = Column(String)
    status = Column(String, nullable=False, default="disponível")
    data_emprestimo = Column(DateTime, nullable=True)
    capa = Column(Text, nullable=True)

# Pydantic models para a API
class LivroCreate(BaseModel):
    titulo: str
    autor: str
    ano: int
    genero: Optional[str] = None
    isbn: Optional[str] = None
    status: str = "disponível"
    capa: Optional[str] = None

class LivroResponse(LivroCreate):
    id: int
    data_emprestimo: Optional[datetime] = None

# Configurar compatibilidade com pydantic v1 e v2
# - pydantic v1: usa `Config` com orm_mode = True
# - pydantic v2: usa `model_config = ConfigDict(from_attributes=True)`
try:
    # pydantic v2
    from pydantic import ConfigDict  # type: ignore
    LivroResponse.model_config = ConfigDict(from_attributes=True)
except Exception:
    # pydantic v1
    class _Config:
        orm_mode = True
    LivroResponse.Config = _Config
