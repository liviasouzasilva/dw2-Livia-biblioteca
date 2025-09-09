from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import os

# Criar o diretório do banco de dados se não existir
DB_DIR = os.path.dirname(os.path.abspath(__file__))
if not os.path.exists(DB_DIR):
    os.makedirs(DB_DIR)

# Caminho absoluto para o banco de dados
DB_PATH = os.path.join(DB_DIR, "app.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Importar modelos e criar tabelas
from models import Livro
Base.metadata.create_all(bind=engine)
