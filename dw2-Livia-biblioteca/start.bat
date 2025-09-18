@echo off
echo ==========================================
echo Iniciando Frontend e Backend (janelas separadas)
echo ==========================================

n:: Garantir que o script execute a partir da pasta do repositório
cd /d "%~dp0"

n:: Verificar se o Python está disponível
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Python nao encontrado. Instale o Python 3.8+ e rode novamente.
    pause
    exit /b 1
)

necho [OK] Python encontrado: 
python --version

necho Abrindo janelas para Backend e Frontend...

n:: Iniciar Backend em nova janela (instala dependencias se necessario e inicia uvicorn)
start "Backend" cmd /k "cd /d "%~dp0backend" & echo Atualizando pip... & python -m pip install --upgrade pip & echo Instalando dependencias (se necessario)... & python -m pip install fastapi uvicorn sqlalchemy pydantic python-dotenv pytz & echo Iniciando Uvicorn... & python -m uvicorn app:app --reload --host 127.0.0.1 --port 8000"

n:: Iniciar Frontend em nova janela (servidor estatico)
start "Frontend" cmd /k "cd /d "%~dp0frontend" & echo Iniciando servidor estatico na porta 5500... & python -m http.server 5500"

:: Aguardar alguns segundos para o servidor iniciar, depois abrir o navegador padrão na página do frontend
timeout /t 3 >nul
start "" "http://127.0.0.1:5500/welcome.html"

necho Janelas iniciadas. Acesse:
echo - Backend: http://127.0.0.1:8000
echo - Frontend: http://127.0.0.1:5500/welcome.html
echo Para parar, feche as janelas abertas ou use Ctrl+C dentro delas.
exit /b 0
