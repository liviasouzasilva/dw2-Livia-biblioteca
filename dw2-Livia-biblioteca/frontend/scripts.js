// Configuração inicial
document.addEventListener('DOMContentLoaded', () => {
    const userName = localStorage.getItem('userName');
    if (!userName) {
        window.location.href = 'welcome.html';
        return;
    }
    
    // Atualizar o header com o nome do usuário
    const header = document.querySelector('header h1');
    header.textContent = `Bem-vindo(a), ${userName}!`;
    
    initializeApp();
});

// Variáveis globais
let livros = [];
const API_URL = 'http://127.0.0.1:8000';  // Usando 127.0.0.1 ao invés de localhost
const ITEMS_PER_PAGE = 10;
let currentPage = 1;

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
    await loadLivros();
    setupKeyboardShortcuts();
    loadSortPreference();
}

// Configuração dos event listeners
function setupEventListeners() {
    // Modal novo livro
    const btnNovoLivro = document.getElementById('novo-livro');
    btnNovoLivro.addEventListener('click', () => {
        document.getElementById('modal-livro').showModal();
    });

    // Formulário de livro
    const formLivro = document.getElementById('form-livro');
    formLivro.addEventListener('submit', handleFormSubmit);

    // Filtros
    document.getElementById('search').addEventListener('input', filterLivros);
    document.getElementById('genero-filter').addEventListener('change', filterLivros);
    document.getElementById('ano-filter').addEventListener('input', filterLivros);
    document.getElementById('status-filter').addEventListener('change', filterLivros);

    // Exportar
    document.getElementById('exportar').addEventListener('click', exportarDados);

    // Scroll infinito
    window.addEventListener('scroll', handleInfiniteScroll);
}

// Atalhos de teclado
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key === 'n') {
            document.getElementById('modal-livro').showModal();
        }
    });
}

// Carregar livros da API
async function loadLivros() {
    try {
        const response = await fetch(`${API_URL}/livros`);
        if (!response.ok) throw new Error('Erro ao carregar livros');
        livros = await response.json();
        displayLivros(livros);
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar livros');
    }
}

// Exibir livros na interface
function displayLivros(livrosToDisplay) {
    const grid = document.getElementById('livros-grid');
    grid.innerHTML = '';

    // Agrupar livros em prateleiras de 5
    const livrosPorPrateleira = 5;
    const livrosSliced = livrosToDisplay.slice(0, currentPage * ITEMS_PER_PAGE);
    
    for (let i = 0; i < livrosSliced.length; i += livrosPorPrateleira) {
        const prateleira = document.createElement('div');
        prateleira.className = 'prateleira';
        grid.appendChild(prateleira);

        const livrosDaPrateleira = livrosSliced.slice(i, i + livrosPorPrateleira);
        const livrosContainer = document.createElement('div');
        livrosContainer.style.display = 'grid';
        livrosContainer.style.gridTemplateColumns = `repeat(${livrosPorPrateleira}, 1fr)`;
        livrosContainer.style.gap = '2rem';
        livrosContainer.style.marginBottom = '3rem';

        livrosDaPrateleira.forEach(livro => {
            const card = createLivroCard(livro);
            livrosContainer.appendChild(card);
        });

        grid.appendChild(livrosContainer);
    }
}

// Criar card de livro
function createLivroCard(livro) {
    const card = document.createElement('div');
    card.className = 'livro-card';
    card.style.backgroundColor = getRandomBookColor();
    
    // Informações básicas do livro
    const basicInfo = document.createElement('div');
    basicInfo.className = 'livro-info';
    basicInfo.innerHTML = `
        <h3>${livro.titulo}</h3>
        <p class="autor">${livro.autor}</p>
    `;
    card.appendChild(basicInfo);
    
    // Detalhes expandidos (visíveis no hover)
    const details = document.createElement('div');
    details.className = 'livro-details';
    details.innerHTML = `
        <p>Ano: ${livro.ano}</p>
        <p>Gênero: ${livro.genero || 'Não especificado'}</p>
        <p class="status-${livro.status}">${livro.status}</p>
        ${livro.status === 'emprestado' ? 
            `<p>Emprestado em: ${new Date(livro.data_emprestimo).toLocaleDateString()}</p>` : ''}
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

// Manipular envio do formulário
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Mostrar feedback visual
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Salvando...';
    submitButton.disabled = true;
    
    const formData = {
        titulo: document.getElementById('titulo').value,
        autor: document.getElementById('autor').value,
        ano: parseInt(document.getElementById('ano').value),
        genero: document.getElementById('genero').value,
        isbn: document.getElementById('isbn').value,
        status: document.getElementById('status').value
    };

    // Validação do ano
    const anoAtual = new Date().getFullYear();
    if (formData.ano < 1900 || formData.ano > anoAtual) {
        alert(`O ano deve estar entre 1900 e ${anoAtual}`);
        return;
    }

    // Verificar título duplicado
    if (livros.some(l => l.titulo.toLowerCase() === formData.titulo.toLowerCase())) {
        alert('Já existe um livro com este título');
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
        
        const response = await fetch(`${API_URL}/livros`, requestOptions);

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
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.textContent = 'Salvar';
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
        const endpoint = `${API_URL}/livros/${livroId}/${livro.status === 'disponível' ? 'emprestar' : 'devolver'}`;
        const response = await fetch(endpoint, { method: 'POST' });
        
        if (!response.ok) throw new Error('Erro na operação');
        
        await loadLivros();
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao processar operação');
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

// Scroll infinito
function handleInfiniteScroll() {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    
    if (scrollTop + clientHeight >= scrollHeight - 5) {
        currentPage++;
        displayLivros(livros);
    }
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
