from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models import Livro
from .database import SessionLocal
from datetime import datetime
import pytz

app = FastAPI()

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/livros")
def read_livros(db: SessionLocal = Depends(get_db)):
    livros = db.query(Livro).all()
    return livros

@app.get("/livros/{livro_id}")
def read_livro(livro_id: int, db: SessionLocal = Depends(get_db)):
    livro = db.query(Livro).filter(Livro.id == livro_id).first()
    if livro is None:
        raise HTTPException(status_code=404, detail="Livro não encontrado")
    return livro

@app.post("/livros")
def create_livro(livro: Livro, db: SessionLocal = Depends(get_db)):
    db_livro = Livro(**livro.dict())
    db.add(db_livro)
    try:
        db.commit()
        db.refresh(db_livro)
        return db_livro
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/livros/{livro_id}")
def update_livro(livro_id: int, livro: Livro, db: SessionLocal = Depends(get_db)):
    db_livro = db.query(Livro).filter(Livro.id == livro_id).first()
    if db_livro is None:
        raise HTTPException(status_code=404, detail="Livro não encontrado")
    
    for var, value in vars(livro).items():
        setattr(db_livro, var, value) if value else None
    
    try:
        db.commit()
        db.refresh(db_livro)
        return db_livro
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/livros/{livro_id}")
def delete_livro(livro_id: int, db: SessionLocal = Depends(get_db)):
    livro = db.query(Livro).filter(Livro.id == livro_id).first()
    if livro is None:
        raise HTTPException(status_code=404, detail="Livro não encontrado")
    
    try:
        db.delete(livro)
        db.commit()
        return {"message": "Livro deletado com sucesso"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/livros/{livro_id}/emprestar")
def emprestar_livro(livro_id: int, db: SessionLocal = Depends(get_db)):
    livro = db.query(Livro).filter(Livro.id == livro_id).first()
    if livro is None:
        raise HTTPException(status_code=404, detail="Livro não encontrado")
    
    if livro.status == "emprestado":
        raise HTTPException(status_code=400, detail="Livro já está emprestado")
    
    livro.status = "emprestado"
    livro.data_emprestimo = datetime.now(pytz.UTC)
    
    try:
        db.commit()
        return livro
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/livros/{livro_id}/devolver")
def devolver_livro(livro_id: int, db: SessionLocal = Depends(get_db)):
    livro = db.query(Livro).filter(Livro.id == livro_id).first()
    if livro is None:
        raise HTTPException(status_code=404, detail="Livro não encontrado")
    
    if livro.status == "disponível":
        raise HTTPException(status_code=400, detail="Livro já está disponível")
    
    livro.status = "disponível"
    livro.data_emprestimo = None
    
    try:
        db.commit()
        return livro
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
