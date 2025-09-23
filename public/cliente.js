document.addEventListener('DOMContentLoaded', function() {
    // Variáveis para trackear filtros ativos (para combinação)
    let currentCategoria = null;
    let currentLoja = null;

    // Função principal para carregar os produtos, agora com filtros combinados
    async function carregarProdutos() {
        try {
            const productsContainer = document.getElementById('products-container');
            if (!productsContainer) {
                console.log("Elemento products-container não encontrado. Verifique seu HTML.");
                return;
            }

            let url = '/api/produtos';
            const params = new URLSearchParams();

            // Adiciona fuzzy por padrão para flexibilidade (case-insensitive e parcial)
            params.append('fuzzy', 'true');

            // Adiciona filtros ativos
            if (currentCategoria) {
                params.append('categoria', currentCategoria);
            }
            if (currentLoja) {
                params.append('loja', currentLoja);
            }
            // Para search, vamos pegar do input (se não, usa o atual)
            const searchInput = document.querySelector('.search-bar input');
            const termoBusca = searchInput ? searchInput.value.trim() : '';
            if (termoBusca) {
                params.append('termo', termoBusca);
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            // LOG PARA DEBUG: Veja no console o que está sendo enviado
            console.log('URL da requisição:', url);
            console.log('Filtros ativos:', { categoria: currentCategoria, loja: currentLoja, termo: termoBusca });

            const response = await fetch(url);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao carregar produtos do servidor.');
            }

            const produtos = await response.json();
            
            // LOG PARA DEBUG: Veja o que foi recebido
            console.log('Produtos recebidos:', produtos.length, 'itens');
            if (produtos.length > 0) {
                console.log('Exemplo de produto:', produtos[0]); // Primeiro item para verificar campos
            }

            productsContainer.innerHTML = '';

            if (!Array.isArray(produtos) || produtos.length === 0) {
                productsContainer.innerHTML = '<p class="no-products">Nenhum produto encontrado.</p>';
                return;
            }

            produtos.forEach(produto => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.innerHTML = `
                    <img src="${produto.imagem_url}" alt="${produto.nome}" onerror="this.src='https://via.placeholder.com/300x200?text=Imagem+Nao+Disponivel'">
                    <h3>${produto.nome}</h3>
                    <p>${produto.descricao}</p>
                    <strong>R$ ${parseFloat(produto.preco).toFixed(2)}</strong><br>
                    <a href="${produto.link}" target="_blank">Ver Produto!</a>
                `;
                productsContainer.appendChild(productCard);
            });

        } catch (error) {
            console.error('Erro ao carregar produtos:', error.message);
            const productsContainer = document.getElementById('products-container');
            if (productsContainer) {
                 productsContainer.innerHTML = `<p class="no-products">Ocorreu um erro ao carregar os produtos: ${error.message}</p>`;
            }
        }
    }

    // Função para cadastrar produto via API (mantida inalterada)
    async function cadastrarProduto(dados) {
        try {
            const response = await fetch('/api/cadastrar-produto', {
                method: 'POST',
                body: dados,
            });

            if (!response.ok) {
                let errorText = await response.text();
                try {
                    const errorData = JSON.parse(errorText);
                    errorText = errorData.error || 'Erro desconhecido.';
                } catch (e) {
                    console.error("A resposta não é JSON. Conteúdo:", errorText);
                    errorText = `Erro do servidor: ${response.status} ${response.statusText}. Por favor, verifique o console para mais detalhes.`;
                }
                throw new Error(errorText);
            }

            const result = await response.json();
            return { success: true, message: result.message };

        } catch (error) {
            console.error('Erro no cadastro:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Lógica para o formulário de cadastro (mantida inalterada)
    const formProduto = document.getElementById('cadastro-produto-form');
    if (formProduto) {
        formProduto.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(formProduto);
            
            const submitBtn = formProduto.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';
            submitBtn.disabled = true;

            const resultado = await cadastrarProduto(formData);
            
            if (resultado.success) {
                alert('Produto cadastrado com sucesso!');
                formProduto.reset();
                // Recarrega produtos após cadastro
                carregarProdutos();
            } else {
                alert(`Erro: ${resultado.error}`);
            }
            
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
    }

    // Lógica para a vitrine de produtos (se o elemento existir)
    const productsContainer = document.getElementById('products-container');
    if (productsContainer) {
        const searchInput = document.querySelector('.search-bar input');
        const searchButton = document.querySelector('.search-bar button');
        const filterButtons = document.querySelectorAll('.filters button');
        const storeButtons = document.querySelectorAll('.stores button');

        // Carrega produtos iniciais sem filtros
        carregarProdutos();

        // Filtros de Categoria: Agora permite múltiplos? Não, mas ativa apenas um por grupo
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active apenas do grupo de categorias
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                currentCategoria = this.dataset.categoria || null; // Atualiza o filtro ativo
                console.log('Categoria selecionada:', currentCategoria); // Debug
                carregarProdutos(); // Recarrega com todos os filtros ativos
            });
        });
        
        // Filtros de Loja: Similar, grupo separado
        storeButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active apenas do grupo de lojas
                storeButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                currentLoja = this.dataset.loja || null; // Atualiza o filtro ativo
                console.log('Loja selecionada:', currentLoja); // Debug
                carregarProdutos(); // Recarrega com todos os filtros ativos
            });
        });

        // Search Button: Limpa categorias e lojas? Não mais, mas pode combinar com elas
        if (searchButton) {
            searchButton.addEventListener('click', function(e) {
                e.preventDefault();
                const termoBusca = searchInput.value.trim();
                // Não limpa mais os outros filtros – permite combinação
                // Se quiser limpar: currentCategoria = null; currentLoja = null; e remove active
                console.log('Busca por termo:', termoBusca); // Debug
                carregarProdutos();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const termoBusca = searchInput.value.trim();
                    console.log('Busca por Enter:', termoBusca); // Debug
                    carregarProdutos();
                }
            });
        }

        // Botão Limpar Filtros (adicione no HTML: <button id="clear-filters">Limpar</button>)
        const clearButton = document.getElementById('clear-filters');
        if (clearButton) {
            clearButton.addEventListener('click', function() {
                currentCategoria = null;
                currentLoja = null;
                searchInput.value = ''; // Limpa search
                filterButtons.forEach(btn => btn.classList.remove('active'));
                storeButtons.forEach(btn => btn.classList.remove('active'));
                console.log('Filtros limpos'); // Debug
                carregarProdutos();
            });
        }
    }
});