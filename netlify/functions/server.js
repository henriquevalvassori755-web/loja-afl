// Importa as bibliotecas necessárias
require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const multer = require('multer');
const serverless = require('serverless-http'); // <-- Adicionada a biblioteca
// Inicializa o aplicativo Express
const app = express();
// Configura o multer para lidar com o upload de arquivos na memória
const upload = multer({ storage: multer.memoryStorage() });
// Configura o middleware para servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Middleware para processar JSON
// Recupera as variáveis de ambiente para conexão com o Supabase

// Inicializa o cliente Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
// Inicializa o cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Rota para listar todos os produtos, filtrar por categoria, loja e buscar por termo
app.get('/api/produtos', async (req, res) => {
    // Recupera e sanitiza os query params
    let { categoria, termo, loja, page = 1, limit = 50, orderBy = 'nome_asc' } = req.query;
    
    // Sanitização: remove espaços extras e converte para string
    if (categoria) categoria = categoria.toString().trim();
    if (loja) loja = loja.toString().trim();
    if (termo) termo = termo.toString().trim();
    
    // Paginação: converte para números inteiros
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 50, 100); // Limite máximo de 100 para evitar overload
    const offset = (pageNum - 1) * limitNum;
    
    let query = supabase.from('produtos').select('*');
    // Filtro por categoria (agora case-insensitive e parcial com ilike)
    if (categoria) {
        query = query.ilike('categoria', `%${categoria}%`);
    }
    // Filtro por loja (agora case-insensitive e parcial com ilike)
    if (loja) {
        query = query.ilike('loja', `%${loja}%`);
    }
// Filtro por termo de busca (nome ou descrição) - Mantido como estava, pois está perfeito
    if (termo) {
        query = query.or(`nome.ilike.%${termo}%,descricao.ilike.%${termo}%`);
    }
    // Ordenação (ex: nome_asc, preco_desc, created_at_desc)
    if (orderBy) {
        const [column, direction] = orderBy.split('_');
        const validColumns = ['nome', 'preco', 'created_at']; // Ajuste conforme suas colunas
        const validDirections = ['asc', 'desc'];
        if (validColumns.includes(column) && validDirections.includes(direction)) {
            query = query.order(column, { ascending: direction === 'asc' });
        } else {
            // Ordenação padrão se inválido
            query = query.order('nome', { ascending: true });
        }
    } else {
        // Ordenação padrão
        query = query.order('nome', { ascending: true });
    }
    // Paginação
    query = query.range(offset, offset + limitNum - 1);
    const { data, error, count } = await query; // Adicionei 'count' para total de páginas (opcional)
    if (error) {
        console.error('Erro ao buscar produtos:', error);
        return res.status(500).json({ error: `Erro ao buscar produtos. Detalhes: ${error.message}` });
    }
    // Resposta com paginação (opcional, mas útil para frontend)
    res.status(200).json({
        data,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total: count || data.length, // Se count não for usado, use length
            totalPages: count ? Math.ceil(count / limitNum) : 1
        }
    });
});
// Rota para cadastrar um novo produto com upload de imagem (mantida inalterada)
app.post('/api/cadastrar-produto', upload.single('imagem'), async (req, res) => {
    const { nome, categoria, descricao, preco, loja, link } = req.body;
    const imagemFile = req.file;
    if (!imagemFile) {
        return res.status(400).json({ error: 'Nenhuma imagem foi enviada.' });
    }
    const fileName = `${Date.now()}-${imagemFile.originalname}`;
    const filePath = `produtos/${fileName}`;
    try {
        const { error: uploadError } = await supabase.storage
            .from('imagens-produtos')
            .upload(filePath, imagemFile.buffer, {
                contentType: imagemFile.mimetype,
            });

             if (uploadError) {
            console.error('Erro no upload da imagem:', uploadError);
            return res.status(500).json({ error: 'Erro ao fazer upload da imagem.' });
        }
        const { data: publicUrlData } = supabase.storage
            .from('imagens-produtos')
            .getPublicUrl(filePath);
        const imagem_url = publicUrlData.publicUrl;
        const { error: insertError, data: insertData } = await supabase
            .from('produtos')
            .insert([{
                nome,
                categoria,
                descricao,
                preco,
                loja,
                imagem_url,
                link
            }]);
        if (insertError) {
            await supabase.storage.from('imagens-produtos').remove([filePath]);
            console.error('Erro ao cadastrar produto:', insertError);
            return res.status(500).json({ error: 'Erro ao cadastrar produto.' });
        }
        res.status(201).json({ message: 'Produto cadastrado com sucesso!', id: insertData[0].id });
    } catch (err) {
        console.error('Erro no servidor:', err);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
});
// Exporta a aplicação para ser usada pelo Netlify Functions.
// Esta linha é a principal correção para o erro de 'handler not found'.
module.exports.handler = serverless(app);
