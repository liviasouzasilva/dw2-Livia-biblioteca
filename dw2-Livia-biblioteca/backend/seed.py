from datetime import datetime
from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import Livro

# Lista de livros para seed
livros_seed = [
    {
        "titulo": "Dom Casmurro",
        "autor": "Machado de Assis",
        "ano": 1899,
        "genero": "Romance",
        "isbn": "9788535910682",
        "status": "disponível"
    },
    {
        "titulo": "O Pequeno Príncipe",
        "autor": "Antoine de Saint-Exupéry",
        "ano": 1943,
        "genero": "Literatura Infantil",
        "isbn": "9788574123745",
        "status": "disponível"
    },
    {
        "titulo": "1984",
        "autor": "George Orwell",
        "ano": 1949,
        "genero": "Ficção Científica",
        "isbn": "9788535914849",
        "status": "disponível"
    },
    {
        "titulo": "Vidas Secas",
        "autor": "Graciliano Ramos",
        "ano": 1938,
        "genero": "Romance",
        "isbn": "9788535921182",
        "status": "disponível"
    },
    {
        "titulo": "O Senhor dos Anéis",
        "autor": "J.R.R. Tolkien",
        "ano": 1954,
        "genero": "Fantasia",
        "isbn": "9788533613379",
        "status": "disponível"
    },
    {
        "titulo": "Harry Potter e a Pedra Filosofal",
        "autor": "J.K. Rowling",
        "ano": 1997,
        "genero": "Fantasia",
        "isbn": "9788532530783",
        "status": "disponível"
    },
    {
        "titulo": "Memórias Póstumas de Brás Cubas",
        "autor": "Machado de Assis",
        "ano": 1881,
        "genero": "Romance",
        "isbn": "9788535911121",
        "status": "disponível"
    },
    {
        "titulo": "O Alquimista",
        "autor": "Paulo Coelho",
        "ano": 1988,
        "genero": "Romance",
        "isbn": "9788582770108",
        "status": "disponível"
    },
    {
        "titulo": "Capitães da Areia",
        "autor": "Jorge Amado",
        "ano": 1937,
        "genero": "Romance",
        "isbn": "9788535911091",
        "status": "disponível"
    },
    {
        "titulo": "A Metamorfose",
        "autor": "Franz Kafka",
        "ano": 1915,
        "genero": "Ficção",
        "isbn": "9788535904795",
        "status": "disponível"
    },
    {
        "titulo": "O Hobbit",
        "autor": "J.R.R. Tolkien",
        "ano": 1937,
        "genero": "Fantasia",
        "isbn": "9788535920932",
        "status": "disponível"
    },
    {
        "titulo": "Cem Anos de Solidão",
        "autor": "Gabriel García Márquez",
        "ano": 1967,
        "genero": "Realismo Mágico",
        "isbn": "9788535914465",
        "status": "disponível"
    },
    {
        "titulo": "O Cortiço",
        "autor": "Aluísio Azevedo",
        "ano": 1890,
        "genero": "Romance",
        "isbn": "9788535911329",
        "status": "disponível"
    },
    {
        "titulo": "A Hora da Estrela",
        "autor": "Clarice Lispector",
        "ano": 1977,
        "genero": "Romance",
        "isbn": "9788535911275",
        "status": "disponível"
    },
    {
        "titulo": "Grande Sertão: Veredas",
        "autor": "João Guimarães Rosa",
        "ano": 1956,
        "genero": "Romance",
        "isbn": "9788520923251",
        "status": "disponível"
    },
    {
        "titulo": "Quincas Borba",
        "autor": "Machado de Assis",
        "ano": 1891,
        "genero": "Romance",
        "isbn": "9788535911268",
        "status": "disponível"
    },
    {
        "titulo": "O Guarani",
        "autor": "José de Alencar",
        "ano": 1857,
        "genero": "Romance",
        "isbn": "9788535910872",
        "status": "disponível"
    },
    {
        "titulo": "Iracema",
        "autor": "José de Alencar",
        "ano": 1865,
        "genero": "Romance",
        "isbn": "9788535910889",
        "status": "disponível"
    },
    {
        "titulo": "Senhora",
        "autor": "José de Alencar",
        "ano": 1875,
        "genero": "Romance",
        "isbn": "9788535910896",
        "status": "disponível"
    },
    {
        "titulo": "Auto da Barca do Inferno",
        "autor": "Gil Vicente",
        "ano": 1517,
        "genero": "Teatro",
        "isbn": "9788535914888",
        "status": "disponível"
    }
]

def seed_database():
    db = SessionLocal()
    try:
        # Verificar se já existem livros no banco
        existing_books = db.query(Livro).first()
        if existing_books is None:
            # Inserir livros
            for livro_data in livros_seed:
                livro = Livro(**livro_data)
                db.add(livro)
            db.commit()
            print("Base de dados populada com sucesso!")
        else:
            print("Base de dados já contém registros. Seed não executado.")
    except Exception as e:
        print(f"Erro ao popular base de dados: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
