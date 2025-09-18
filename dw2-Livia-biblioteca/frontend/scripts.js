// Configuração inicial
document.addEventListener('DOMContentLoaded', () => {
    // Mostrar cabeçalho genérico sem nome de usuário
    const header = document.querySelector('header h1');
    if (header) header.textContent = 'Bem-vindo!';
    
    initializeApp();
});

// Variáveis globais
let livros = [];
const API_URL = 'http://127.0.0.1:8000';  // Usando 127.0.0.1 ao invés de localhost
const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let lastRenderedCount = 0;

// Default SVG cover (used when livro.capa is not provided)
const DEFAULT_SVG = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 800'>
  <rect width='600' height='800' fill='#eef2ff'/>
  <g fill='#c7d2fe'>
    <rect x='60' y='120' width='480' height='40' rx='6' />
    <rect x='60' y='180' width='380' height='22' rx='4' />
    <rect x='120' y='260' width='360' height='420' rx='8' fill='#ffffff' />
  </g>
  <text x='50%' y='58%' font-size='28' text-anchor='middle' fill='#93a5c6' font-family='Arial, Helvetica, sans-serif'>Sem capa</text>
</svg>`;
const DEFAULT_COVER = 'data:image/svg+xml;utf8,' + encodeURIComponent(DEFAULT_SVG);

// Função para mostrar mensagens de feedback
function showMessage(message, type = 'info') {
    // Criar ou reutilizar o elemento de mensagem
    let messageElement = document.getElementById('feedback-message');
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.id = 'feedback-message';
        document.body.appendChild(messageElement);
    }

    // Configurar a mensagem
    messageElement.textContent = message;
    messageElement.className = `message message-${type}`;
    messageElement.style.display = 'block';

    // Esconder após 5 segundos
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 5000);
}

// Inicialização do aplicativo
async function initializeApp() {
    setupEventListeners();
    // carregar livros mas não abrir modal automaticamente
    await loadLivros();
    setupKeyboardShortcuts();
    loadSortPreference();
}

// Configuração dos event listeners
function setupEventListeners() {
    // Modal novo livro
    const btnNovoLivro = document.getElementById('novo-livro');
    if (btnNovoLivro) {
        btnNovoLivro.addEventListener('click', () => {
            const dlg = document.getElementById('modal-livro');
            if (dlg) dlg.showModal();
        });
    }

    // Formulário de livro
    const formLivro = document.getElementById('form-livro');
    if (formLivro) formLivro.addEventListener('submit', handleFormSubmit);

    // Cancelar do modal: fechar e voltar para a top da página
    const cancelButtons = document.querySelectorAll('#modal-livro button[type="button"]');
    cancelButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const dlg = e.target.closest('dialog');
            if (dlg) dlg.close();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            const preview = document.getElementById('preview-capa');
            const img = document.getElementById('preview-img');
            if (preview) { preview.style.display = 'none'; }
            if (img) { img.src = ''; }
        });
    });

    // Filtros
    const searchEl = document.getElementById('search');
    if (searchEl) searchEl.addEventListener('input', filterLivros);
    const generoEl = document.getElementById('genero-filter');
    if (generoEl) generoEl.addEventListener('change', filterLivros);
    const anoEl = document.getElementById('ano-filter');
    if (anoEl) anoEl.addEventListener('input', filterLivros);
    const statusEl = document.getElementById('status-filter');
    if (statusEl) statusEl.addEventListener('change', filterLivros);

    // Exportar
    const exportBtn = document.getElementById('exportar');
    if (exportBtn) exportBtn.addEventListener('click', exportarDados);

    // Scroll infinito: attach to grid container (vertical only)
    const grid = document.getElementById('livros-grid');
    if (grid) {
        grid.addEventListener('scroll', handleGridScroll);
        // ensure grid has focusable behavior for scroll
        grid.style.overflowY = 'auto';
        grid.style.overflowX = 'hidden';
    }

    // Scroll infinito antigo removido (não usar window scroll)
    // window.addEventListener('scroll', handleInfiniteScroll);
}

// Atalhos de teclado
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key === 'n') {
            document.getElementById('modal-livro').showModal();
        }
    });
}

// Resilient fetch: tenta API_URL e localhost como fallback e aceita endpoint completo ou caminho
async function apiFetch(endpointOrPath, options = {}) {
    const isFullUrl = typeof endpointOrPath === 'string' && endpointOrPath.startsWith('http');
    const candidates = isFullUrl ? [endpointOrPath] : [`${API_URL}${endpointOrPath}`, `http://localhost:8000${endpointOrPath}`];
    let lastError = null;
    for (const url of candidates) {
        try {
            const res = await fetch(url, options);
            return res; // retorna mesmo que seja status >= 400; chamador decide
        } catch (err) {
            console.warn(`apiFetch: falha ao acessar ${url}:`, err);
            lastError = err;
            // tentar próxima URL
        }
    }
    throw lastError || new Error('Erro de rede desconhecido');
}

// Carregar livros da API (usa apiFetch)
async function loadLivros() {
    try {
        const response = await apiFetch('/livros');
        if (!response) throw new Error('Sem resposta do servidor');
        if (!response.ok) {
            const text = await response.text().catch(() => null);
            throw new Error(text || `Erro ao carregar livros: ${response.status} ${response.statusText}`);
        }
        livros = await response.json();
        displayLivros(livros);
    } catch (error) {
        console.error('Erro ao carregar livros:', error);
        alert('Erro ao carregar livros. Verifique se o backend está rodando em http://127.0.0.1:8000 ou http://localhost:8000 e que o CORS está configurado. Detalhe: ' + (error.message || error));
    }
}

// Atualizar select de edição ao carregar/exibir livros
function updateEditarSelect() {
    const select = document.getElementById('editar-select');
    if (!select) return;
    select.innerHTML = '<option value="">Selecione um livro...</option>';
    livros.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l.id;
        opt.textContent = `${l.titulo} — ${l.autor || 'Autor'}`;
        select.appendChild(opt);
    });
}

// Exibir livros na interface (renderizar inicialmente ou após filtros)
function displayLivros(livrosToDisplay) {
    const grid = document.getElementById('livros-grid');
    grid.innerHTML = '';

    // reset pagination
    currentPage = 1;
    lastRenderedCount = 0;

    const livrosSliced = livrosToDisplay.slice(0, currentPage * ITEMS_PER_PAGE);

    livrosSliced.forEach(livro => {
        const card = createLivroCard(livro);
        grid.appendChild(card);
    });

    lastRenderedCount = grid.children.length;
}

// Append next page of livros to grid (used by infinite scroll)
function appendMoreLivros(allLivros) {
    const grid = document.getElementById('livros-grid');
    const start = lastRenderedCount;
    const end = Math.min(allLivros.length, start + ITEMS_PER_PAGE);
    if (start >= end) return; // nothing to add

    for (let i = start; i < end; i++) {
        const card = createLivroCard(allLivros[i]);
        grid.appendChild(card);
    }
    lastRenderedCount = grid.children.length;
}

// Scroll handler para o container #livros-grid
function handleGridScroll(e) {
    const grid = e.target;
    if (!grid) return;
    const { scrollTop, scrollHeight, clientHeight } = grid;
    // quando atingir próximo do final, carregar mais
    if (scrollTop + clientHeight >= scrollHeight - 80) {
        // incrementar página lógica (opcional)
        currentPage++;
        appendMoreLivros(livros);
    }
}

// Criar card de livro (novo layout conforme especificado)
function createLivroCard(livro) {
    const card = document.createElement('div');
    card.className = 'livro-card';

    // Wrapper da capa com proporção 3:4
    const coverWrapper = document.createElement('div');
    coverWrapper.className = 'cover-wrapper';

    // Always create an img element; use capa if provided, otherwise default cover
    const img = document.createElement('img');
    img.alt = `Capa de ${livro.titulo}`;
    img.src = livro.capa && livro.capa.trim() ? livro.capa : DEFAULT_COVER;
    coverWrapper.appendChild(img);

    // Badge de status no canto superior direito da capa
    const badge = document.createElement('div');
    badge.className = 'status-badge ' + (livro.status === 'disponível' ? 'status-available' : 'status-borrowed');
    badge.textContent = livro.status && livro.status[0] ? livro.status.charAt(0).toUpperCase() + livro.status.slice(1) : '';
    coverWrapper.appendChild(badge);

    card.appendChild(coverWrapper);

    // Corpo do card com título e autor
    const body = document.createElement('div');
    body.className = 'livro-body';
    body.innerHTML = `
        <h3>${livro.titulo}</h3>
        <p class="autor">${livro.autor || 'Autor não informado'}</p>
    `;
    card.appendChild(body);

    // Detalhes expandidos (overlay) com ações
    const details = document.createElement('div');
    details.className = 'livro-details';
    details.innerHTML = `
        <p>Ano: ${livro.ano}</p>
        <p>Gênero: ${livro.genero || 'Não especificado'}</p>
        <p class="status-${livro.status}">${livro.status}</p>
        ${livro.status === 'emprestado' && livro.data_emprestimo ? `<p>Emprestado em: ${new Date(livro.data_emprestimo).toLocaleDateString()}</p>` : ''}
        <button onclick="handleEmprestimoDevolucao(${livro.id})" 
                aria-label="${livro.status === 'disponível' ? 'Emprestar' : 'Devolver'} ${livro.titulo}">
            ${livro.status === 'disponível' ? 'Emprestar' : 'Devolver'}
        </button>
    `;
    card.appendChild(details);

    return card;
}

// Cores aleatórias para os livros
function getRandomBookColor() {
    const colors = [
        '#1E3A8A', // primary
        '#1E40AF',
        '#1D4ED8',
        '#2563EB',
        '#3B82F6'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Preview de capa
const inputCapa = document.getElementById('capa');
if(inputCapa){
    inputCapa.addEventListener('change', function(){
        const file = this.files[0];
        const preview = document.getElementById('preview-capa');
        const img = document.getElementById('preview-img');
        if(!file){ preview.style.display='none'; img.src=''; return; }
        const reader = new FileReader();
        reader.onload = function(e){ img.src = e.target.result; preview.style.display='block'; }
        reader.readAsDataURL(file);
    });
}

// Manipular envio do formulário
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Mostrar feedback visual
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Salvando...';
    submitButton.disabled = true;
    
    const anoValue = document.getElementById('ano').value;
    const file = document.getElementById('capa')?.files[0];
    let capaBase64 = null;
    if(file){
        capaBase64 = await new Promise((res, rej)=>{
            const r = new FileReader();
            r.onload = ()=> res(r.result);
            r.onerror = ()=> rej(new Error('Erro ao ler imagem'));
            r.readAsDataURL(file);
        });
    }

    const formData = {
        titulo: document.getElementById('titulo').value.trim(),
        autor: document.getElementById('autor').value.trim(),
        ano: Number(anoValue) || 0,
        genero: document.getElementById('genero').value,
        isbn: document.getElementById('isbn').value.trim(),
        status: document.getElementById('status').value,
        capa: capaBase64
    };

    // Validação básica
    const anoAtual = new Date().getFullYear();
    if (!formData.titulo || formData.titulo.length < 3) {
        showMessage('Título inválido (mínimo 3 caracteres)', 'error');
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
        return;
    }

    if (!formData.autor) {
        showMessage('Autor é obrigatório', 'error');
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
        return;
    }

    if (isNaN(formData.ano) || formData.ano < 1900 || formData.ano > anoAtual) {
        showMessage(`O ano deve estar entre 1900 e ${anoAtual}`, 'error');
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
        return;
    }

    // Verificar título duplicado
    if (livros.some(l => l.titulo && l.titulo.toLowerCase() === formData.titulo.toLowerCase())) {
        showMessage('Já existe um livro com este título', 'error');
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
        return;
    }

    try {
        console.log('Tentando salvar livro:', formData);
        console.log('URL da API:', API_URL);
        
        const requestOptions = {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        };
        
        console.log('Opções da requisição:', requestOptions);
        
        // usar apiFetch para maior resiliência
        const response = await apiFetch('/livros', requestOptions);

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.detail || `Erro ${response.status}: ${response.statusText}`);
        }
        
        const novoLivro = await response.json();
        console.log('Livro salvo com sucesso:', novoLivro);
        
        // Atualizar a lista de livros
        livros.push(novoLivro);
        displayLivros(livros);
        
        // Fechar modal e limpar formulário
        document.getElementById('modal-livro').close();
        e.target.reset();
        
        // Mostrar mensagem de sucesso
        showMessage('Livro adicionado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao salvar livro:', error);
        showMessage(`Erro ao salvar livro: ${error.message}`, 'error');
    } finally {
        // Restaurar botão
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
    }
}

// Filtrar livros
function filterLivros() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const genero = document.getElementById('genero-filter').value;
    const ano = document.getElementById('ano-filter').value;
    const status = document.getElementById('status-filter').value;

    const filteredLivros = livros.filter(livro => {
        const matchesSearch = livro.titulo.toLowerCase().includes(searchTerm) || 
                            livro.autor.toLowerCase().includes(searchTerm);
        const matchesGenero = !genero || livro.genero === genero;
        const matchesAno = !ano || livro.ano === parseInt(ano);
        const matchesStatus = !status || livro.status === status;

        return matchesSearch && matchesGenero && matchesAno && matchesStatus;
    });

    displayLivros(filteredLivros);
}

// Gerenciar empréstimo/devolução
async function handleEmprestimoDevolucao(livroId) {
    const livro = livros.find(l => l.id === livroId);
    if (!livro) return;

    try {
        const action = livro.status === 'disponível' ? 'emprestar' : 'devolver';
        const path = `/livros/${livroId}/${action}`;
        const response = await apiFetch(path, { method: 'POST' });
        
        if (!response.ok) throw new Error(`Erro na operação: ${response.status}`);
        
        await loadLivros();
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao processar operação: ' + (error.message || error));
    }
}

// Exportar dados
function exportarDados() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const filteredLivros = livros.filter(livro => 
        livro.titulo.toLowerCase().includes(searchTerm) || 
        livro.autor.toLowerCase().includes(searchTerm)
    );

    const format = prompt('Escolha o formato (csv ou json):').toLowerCase();
    
    if (format === 'csv') {
        exportCSV(filteredLivros);
    } else if (format === 'json') {
        exportJSON(filteredLivros);
    } else {
        alert('Formato inválido');
    }
}

// Exportar para CSV
function exportCSV(data) {
    const headers = ['titulo', 'autor', 'ano', 'genero', 'isbn', 'status', 'data_emprestimo'];
    const csv = [
        headers.join(','),
        ...data.map(item => headers.map(header => 
            `"${(item[header] || '').toString().replace(/"/g, '""')}"`
        ).join(','))
    ].join('\n');

    downloadFile(csv, 'livros.csv', 'text/csv');
}

// Exportar para JSON
function exportJSON(data) {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, 'livros.json', 'application/json');
}

// Download de arquivo
function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Gerenciamento de ordenação
function loadSortPreference() {
    const sortPreference = localStorage.getItem('sortPreference');
    if (sortPreference) {
        const [field, direction] = sortPreference.split('-');
        sortLivros(field, direction);
    }
}

function sortLivros(field, direction) {
    livros.sort((a, b) => {
        const aValue = a[field];
        const bValue = b[field];
        return direction === 'asc' ? 
            (aValue > bValue ? 1 : -1) : 
            (aValue < bValue ? 1 : -1);
    });
    
    localStorage.setItem('sortPreference', `${field}-${direction}`);
    displayLivros(livros);
}

// Editar e remover selecionado
function setupEditRemoveHandlers() {
    const editarBtn = document.getElementById('editar-btn');
    const removerBtn = document.getElementById('remover-btn');
    const select = document.getElementById('editar-select');

    if (editarBtn) {
        editarBtn.addEventListener('click', () => {
            const id = select.value;
            if (!id) { showMessage('Selecione um livro para editar', 'error'); return; }
            const livro = livros.find(l => String(l.id) === String(id));
            if (!livro) { showMessage('Livro não encontrado', 'error'); return; }
            // preenche o modal com os dados do livro e abre para editar
            const dlg = document.getElementById('modal-livro');
            document.getElementById('titulo').value = livro.titulo || '';
            document.getElementById('autor').value = livro.autor || '';
            document.getElementById('ano').value = livro.ano || '';
            document.getElementById('genero').value = livro.genero || '';
            document.getElementById('isbn').value = livro.isbn || '';
            document.getElementById('status').value = livro.status || 'disponível';
            // manter preview se tiver
            const preview = document.getElementById('preview-capa');
            const img = document.getElementById('preview-img');
            if (livro.capa && img) { img.src = livro.capa; preview.style.display = 'block'; }

            if (dlg) dlg.showModal();

            // Substituir temporariamente o submit handler para fazer PUT em vez de POST
            const form = document.getElementById('form-livro');
            form.removeEventListener('submit', handleFormSubmit);
            form.addEventListener('submit', async function onEditSubmit(e) {
                e.preventDefault();
                const formData = {
                    titulo: document.getElementById('titulo').value.trim(),
                    autor: document.getElementById('autor').value.trim(),
                    ano: Number(document.getElementById('ano').value) || 0,
                    genero: document.getElementById('genero').value,
                    isbn: document.getElementById('isbn').value.trim(),
                    status: document.getElementById('status').value,
                    capa: document.getElementById('preview-img').src || null
                };
                try {
                    const res = await apiFetch(`/livros/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
                    if (!res.ok) throw new Error('Erro ao editar');
                    await loadLivros();
                    showMessage('Livro atualizado', 'success');
                    document.getElementById('modal-livro').close();
                } catch (err) { showMessage('Erro ao atualizar livro', 'error'); }
                // restaurar submit
                form.removeEventListener('submit', onEditSubmit);
                form.addEventListener('submit', handleFormSubmit);
            });
        });
    }

    if (removerBtn) {
        removerBtn.addEventListener('click', async () => {
            const id = select.value;
            if (!id) { showMessage('Selecione um livro para remover', 'error'); return; }
            if (!confirm('Tem certeza que deseja remover este livro?')) return;
            try {
                const res = await apiFetch(`/livros/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Erro ao remover');
                await loadLivros();
                showMessage('Livro removido', 'success');
            } catch (err) { showMessage('Erro ao remover livro', 'error'); }
        });
    }
}

// Chamar setupEditRemoveHandlers no load
window.addEventListener('DOMContentLoaded', () => {
    setupEditRemoveHandlers();
});
