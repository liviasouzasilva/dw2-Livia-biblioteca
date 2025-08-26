from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

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

# Pydantic model for API
class LivroCreate(BaseModel):
    titulo: str
    autor: str
    ano: int
    genero: Optional[str] = None
    isbn: Optional[str] = None
    status: str = "disponível"

class LivroResponse(LivroCreate):
    id: int
    data_emprestimo: Optional[datetime] = None

    class Config:
        orm_mode = True

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
