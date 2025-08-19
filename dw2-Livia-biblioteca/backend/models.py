from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

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
