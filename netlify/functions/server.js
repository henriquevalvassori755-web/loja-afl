// Importa as bibliotecas necessárias
// O nome do arquivo pode ser main.js, products.js ou similar.

// Variáveis para rastrear o estado dos filtros
let filtroCategoriaAtivo = 'all';
let filtroLojaAtivo = 'all';
let termoDeBuscaAtivo = '';

// Função para carregar e filtrar produtos da API
async function carregarEFiltrarProdutos() {
    try {
        console.log("Chamando a API com filtros...");
        
        // Constrói a URL da API com os parâmetros de filtro e busca
        const params = new URLSearchParams();
        if (filtroCategoriaAtivo !== 'all') {
            params.append('categoria', filtroCategoriaAtivo);
        }
        if (filtroLojaAtivo !== 'all') {
            params.append('loja', filtroLojaAtivo);
        }
        if (termoDeBuscaAtivo !== '') {
            params.append('termo', termoDeBuscaAtivo);
        }

        const url = `/api/produtos?${params.toString()}`;
        
        const productsContainer = document.getElementById('products-container');
        productsContainer.innerHTML = '<p class="loading">Carregando produtos...</p>';

        const response = await fetch(url);
        const produtos = await response.json();

        if (!response.ok) {
            throw new Error(produtos.error || 'Erro ao carregar produtos.');
        }

        productsContainer.innerHTML = '';
        if (produtos.length === 0) {
            productsContainer.innerHTML = '<p class="no-products">Nenhum produto encontrado com esses filtros.</p>';
            return;
        }

        produtos.forEach(produto => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            
            productCard.innerHTML = `
                <img src="${produto.imagem_url}" alt="${produto.nome}" class="product-img" onerror="this.src='https://via.placeholder.com/300x200?text=Imagem+Não+Disponível'">
                <div class="product-info">
                    <h3 class="product-title">${produto.nome}</h3>
                    <p class="product-description">${produto.descricao}</p>
                    <p class="product-store">Loja: ${produto.loja}</p>
                    <span class="product-price">R$ ${parseFloat(produto.preco).toFixed(2)}</span>
                    <a href="${produto.link}" class="product-link-btn" target="_blank">Ver Oferta</a>
                </div>
            `;
            productsContainer.appendChild(productCard);
        });
    } catch (error) {
        console.error('Erro inesperado:', error);
        document.getElementById('products-container').innerHTML = `<p class="error">Erro: ${error.message}</p>`;
    }
}

// Inicialização e configuração de eventos
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('products-container')) {
        carregarEFiltrarProdutos();
        
        const filterButtons = document.querySelectorAll('.filter-btn');
        const searchInput = document.querySelector('.search-bar input');
        const searchButton = document.querySelector('.search-bar button');
        
        if (filterButtons.length > 0) {
            filterButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const parentDiv = this.parentElement;
                    const buttonsInGroup = parentDiv.querySelectorAll('.filter-btn');
                    buttonsInGroup.forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');

                    const category = this.getAttribute('data-category');
                    const store = this.getAttribute('data-store');
                    if (category) {
                        filtroCategoriaAtivo = category;
                    }
                    if (store) {
                        filtroLojaAtivo = store;
                    }
                    
                    carregarEFiltrarProdutos();
                });
            });
        }
        
        if (searchButton && searchInput) {
            const aplicarBusca = () => {
                termoDeBuscaAtivo = searchInput.value;
                carregarEFiltrarProdutos();
            };

            searchButton.addEventListener('click', aplicarBusca);
            
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    aplicarBusca();
                }
            });
        }
    }
});