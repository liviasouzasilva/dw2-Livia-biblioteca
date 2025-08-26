@echo off
echo ==========================================
echo Verificando ambiente Python...
echo ==========================================

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Python nao encontrado!
    echo Por favor, instale o Python 3.8 ou superior.
    echo Voce pode baixar em: https://www.python.org/downloads/
    echo IMPORTANTE: Marque a opcao "Add Python to PATH" durante a instalacao
    pause
    exit /b 1
)

echo [OK] Python encontrado!
python --version
echo.

echo ==========================================
echo Instalando dependencias...
echo ==========================================

cd backend
echo [INFO] Atualizando pip...
python -m pip install --upgrade pip

echo [INFO] Instalando pacotes necessarios...
python -m pip install fastapi uvicorn sqlalchemy pydantic python-dotenv pytz

if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias
    pause
    exit /b 1
)

echo [OK] Dependencias instaladas com sucesso!
echo.

echo ==========================================
echo Iniciando o servidor...
echo ==========================================
echo 1. Aguarde a mensagem "Application startup complete"
echo 2. Abra o navegador em: http://127.0.0.1:5500/frontend/welcome.html
echo 3. Para parar o servidor, pressione Ctrl+C
echo ==========================================
echo.

python -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
