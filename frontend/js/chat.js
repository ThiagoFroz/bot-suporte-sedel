let sessionId = sessionStorage.getItem('sedel_session');

if (!sessionId) {
  sessionId = `sess_${Math.random().toString(36).slice(2, 11)}`;
  sessionStorage.setItem('sedel_session', sessionId);
}

window.addEventListener('load', iniciarConversa);

async function iniciarConversa() {
  document.getElementById('chatArea').innerHTML = '';
  document.getElementById('opcoesArea').innerHTML = '';
  const resp = await enviarParaAPI('');
  if (resp) mostrarMensagemBot(resp);
}

async function enviarMensagem(event) {
  if (event) event.preventDefault();

  const input = document.getElementById('inputMensagem');
  const texto = input.value.trim();

  if (!texto) return;

  input.value = '';
  input.style.height = 'auto';
  limparOpcoes();
  adicionarMensagem('user', texto);
  mostrarDigitando();

  const resp = await enviarParaAPI(texto);
  removerDigitando();
  if (resp) mostrarMensagemBot(resp);
}

function clicarOpcao(texto) {
  limparOpcoes();
  adicionarMensagem('user', texto);
  mostrarDigitando();

  enviarParaAPI(texto).then((resp) => {
    removerDigitando();
    if (resp) mostrarMensagemBot(resp);
  });
}

async function enviarParaAPI(mensagem) {
  try {
    return await api.post('/api/chat', { mensagem, sessionId });
  } catch (err) {
    return {
      resposta: 'Nao foi possivel conectar ao servidor. Verifique se o backend esta rodando.',
      opcoes: []
    };
  }
}

function mostrarMensagemBot(dados) {
  adicionarMensagem('bot', formatarTexto(dados.resposta), dados.tipoChamado);

  if (dados.numeroChamado) {
    const card = document.createElement('div');
    card.className = 'chamado-card';
    card.innerHTML = `Chamado registrado: <span class="numero">${dados.numeroChamado}</span>`;
    document.getElementById('chatArea').appendChild(card);
    rolarChat();
  }

  if (dados.opcoes && dados.opcoes.length > 0) {
    renderizarOpcoes(dados.opcoes);
  }
}

function formatarTexto(txt) {
  return txt
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>');
}

function adicionarMensagem(tipo, texto, nivel) {
  const chatArea = document.getElementById('chatArea');
  const msg = document.createElement('div');
  msg.className = `msg ${tipo}`;

  const av = document.createElement('div');
  av.className = 'msg-av';
  av.textContent = tipo === 'bot' ? 'TI' : 'EU';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = texto;

  if (nivel && tipo === 'bot') {
    const badge = document.createElement('span');
    badge.className = `badge badge-${nivel.toLowerCase()}`;
    badge.textContent = nivel;
    bubble.appendChild(badge);
  }

  msg.appendChild(av);
  msg.appendChild(bubble);
  chatArea.appendChild(msg);
  rolarChat();
}

function renderizarOpcoes(opcoes) {
  const area = document.getElementById('opcoesArea');
  area.innerHTML = '';

  opcoes.forEach((opcao) => {
    const btn = document.createElement('button');
    btn.className = 'opcao-btn';
    btn.textContent = opcao;
    btn.type = 'button';
    btn.onclick = () => clicarOpcao(opcao);
    area.appendChild(btn);
  });
}

function limparOpcoes() {
  document.getElementById('opcoesArea').innerHTML = '';
}

function mostrarDigitando() {
  const chatArea = document.getElementById('chatArea');
  const div = document.createElement('div');
  div.className = 'msg bot';
  div.id = 'typing-indicator';
  div.innerHTML = '<div class="msg-av">TI</div><div class="msg-bubble typing"><span></span><span></span><span></span></div>';
  chatArea.appendChild(div);
  rolarChat();
}

function removerDigitando() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

async function resetarConversa() {
  await api.post('/api/chat/reset', { sessionId }).catch(() => {});
  iniciarConversa();
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 90)}px`;
}

function rolarChat() {
  const chatArea = document.getElementById('chatArea');
  chatArea.scrollTop = chatArea.scrollHeight;
}
