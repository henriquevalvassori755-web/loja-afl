/**
 * Este script verifica a disponibilidade de um serviço ou servidor principal.
 * Se o serviço não responder, ele redireciona o usuário para um URL de backup.
 * O script só funciona se o site principal for carregado com sucesso no navegador.
 */

// URL do seu serviço principal para checagem (pode ser a sua API ou o próprio site)
const MAIN_SERVER_URL = 'https://afl-loja-super.netlify.app/';

// URL do seu servidor de backup
const BACKUP_SERVER_URL = 'https://SEU_SITE_DE_BACKUP.com';

// Tempo máximo de espera pela resposta do servidor principal (em milissegundos)
const TIMEOUT_MS = 5000;

/**
 * Função principal para verificar o status do servidor.
 */
async function checkServerStatus() {
  try {
    // Tenta fazer uma requisição para o servidor principal
    const response = await fetch(MAIN_SERVER_URL, {
      method: 'GET',
      mode: 'no-cors', // Permite requisições entre origens para checar a disponibilidade
      signal: AbortSignal.timeout(TIMEOUT_MS) // Aborta a requisição após o timeout
    });

    // Se a requisição for bem-sucedida, o servidor está online.
    // Nada a fazer.
    console.log('Servidor principal está online.');

  } catch (error) {
    // Se a requisição falhar (por timeout, erro de rede, etc.), o servidor está inacessível.
    console.error('Servidor principal inacessível. Redirecionando...', error);
    
    // Redireciona o usuário para o servidor de backup
    window.location.href = BACKUP_SERVER_URL;
  }
}

// Inicia a checagem do servidor quando a página carregar
window.onload = checkServerStatus;
