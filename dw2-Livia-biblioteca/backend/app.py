from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from models import Livro, LivroCreate, LivroResponse
from database import SessionLocal, engine
from datetime import datetime
import pytz

# Criar as tabelas
import models
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500", "null"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
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

@app.post("/livros", response_model=LivroResponse)
def create_livro(livro: LivroCreate, db: SessionLocal = Depends(get_db)):
    print(f"Recebendo requisição para criar livro: {livro}")
    try:
        db_livro = Livro(
            titulo=livro.titulo,
            autor=livro.autor,
            ano=livro.ano,
            genero=livro.genero,
            isbn=livro.isbn,
            status=livro.status
        )
        print(f"Criando objeto do livro: {db_livro}")
        db.add(db_livro)
        try:
            db.commit()
            db.refresh(db_livro)
            print(f"Livro criado com sucesso: {db_livro}")
            return db_livro
        except Exception as e:
            db.rollback()
            print(f"Erro ao salvar no banco: {str(e)}")
            import traceback
            print("Traceback completo:")
            traceback.print_exc()
            raise HTTPException(status_code=400, detail=f"Erro ao salvar no banco: {str(e)}")
    except Exception as e:
        print(f"Erro ao processar dados: {str(e)}")
        import traceback
        print("Traceback completo:")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Erro ao processar dados: {str(e)}")

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
