const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));

// ─── SISTEMAS COM LINK DIRETO (N0 especial) ────────────────────────────────
// Sistemas que têm portal próprio de acesso/recuperação de senha.
const sistemasComLink = [
  {
    palavrasChave: ['siged', 'senha do siged', 'resetar siged', 'acessar siged'],
    solucao: `🔐 *Acesso ao SIGED*\n\nPara acessar ou recuperar sua senha do SIGED, utilize o portal oficial:\n\n👉 https://sistemas.sefaz.am.gov.br/siged/\n\nNa página inicial clique em *"Esqueci minha senha"* e siga as instruções com seu CPF ou e-mail institucional.\n\n⚠️ Se o problema persistir após tentar pelo portal, abra um chamado que a TI te ajuda.\n\nConseguiu acessar?`,
    nivel: 0,
    categoria: 'Acesso SIGED'
  }
];

// ─── SISTEMAS INTERNOS: exigem TI, nunca autoatendimento ────────────────────
// Palavras-chave de sistemas específicos que só o TI pode resolver.
// Se detectadas, o bot IGNORA a base N0 e escala direto para N1.
const sistemasInternos = [
  'sigef', 'sisp', 'sefin', 'protocolo', 'sei', 'sgp',
  'sistema de gestão', 'sistema interno', 'sistema da secretaria',
  'portal do servidor', 'ponto eletrônico', 'contracheque'
];

// ─── BASE DE CONHECIMENTO (Nível 0 - Autoatendimento) ───────────────────────
// REGRA: só entram aqui passos que o usuário COMUM consegue executar
// sem permissão de administrador e sem acesso à infraestrutura de TI.
const baseConhecimento = [
  {
    // Senha GENÉRICA (Windows/e-mail) — sem mencionar sistema interno
    palavrasChave: ['senha do windows', 'senha do computador', 'senha expirou', 'trocar senha do windows'],
    solucao: `🔑 *Redefinição de Senha do Windows*\n\nEsta operação exige intervenção da equipe de TI pois as senhas são gerenciadas pelo Active Directory corporativo.\n\nVou abrir um chamado para você agora. Um técnico entrará em contato em breve.\n\nDeseja confirmar a abertura do chamado?`,
    nivel: 0,
    encaminhar: true, // força abertura de chamado N1
    categoria: 'Acesso'
  },
  {
    // Impressora — passos que usuário comum pode fazer
    palavrasChave: ['impressora', 'imprimir', 'papel', 'toner', 'impressão', 'não imprime'],
    solucao: `🖨️ *Problemas com Impressora*\n\nTente estas etapas (sem precisar de TI):\n1. Verifique se a impressora está *ligada* e com *papel*\n2. Cancele os trabalhos na fila: clique no ícone da impressora na barra de tarefas → cancele os documentos pendentes\n3. *Desligue* a impressora, aguarde 30 segundos e *ligue novamente*\n4. Verifique se o *cabo* USB ou de rede está bem conectado\n\n⚠️ *Não* tente reinstalar drivers — isso requer permissão de administrador. Se os passos acima não resolverem, abra um chamado.\n\nSeu problema foi resolvido?`,
    nivel: 0,
    categoria: 'Hardware'
  },
  {
    // Internet — apenas passos sem acesso de admin
    palavrasChave: ['internet', 'sem internet', 'sem acesso', 'não carrega', 'página não abre'],
    solucao: `🌐 *Sem Acesso à Internet*\n\nTente estas etapas (sem precisar de TI):\n1. Verifique se o *cabo de rede* está bem encaixado na parte traseira do computador\n2. *Reinicie o computador* — isso resolve boa parte dos casos\n3. Tente abrir outro site para confirmar se é o site ou a conexão\n4. Verifique se outros colegas *na mesma sala* também estão sem acesso\n\n⚠️ *Não* tente mexer no adaptador de rede, roteador ou configurações de rede — esses acessos são exclusivos da TI.\n\nSe nenhum passo acima resolver, vou abrir um chamado para a equipe de rede.\n\nSeu problema foi resolvido?`,
    nivel: 0,
    categoria: 'Rede'
  },
  {
    // Computador lento — passos básicos sem admin
    palavrasChave: ['lento', 'travando', 'devagar', 'lentidão', 'demora', 'trava', 'travado'],
    solucao: `💻 *Computador Lento ou Travado*\n\nTente estas etapas:\n1. *Reinicie o computador* (não deixe em hibernação por dias)\n2. Feche programas que não está usando: pressione *Ctrl + Shift + Esc* → aba "Processos" → feche o que não precisa\n3. Aguarde: se o Windows estiver *instalando atualizações*, pode ficar lento temporariamente\n\n⚠️ Limpeza de disco, desfragmentação e outras configurações requerem permissão da TI.\n\nSeu problema foi resolvido?`,
    nivel: 0,
    categoria: 'Performance'
  },
  {
    // E-mail Outlook — passos básicos
    palavrasChave: ['email', 'e-mail', 'outlook', 'correio', 'caixa de entrada', 'não abre email', 'outlook não abre'],
    solucao: `📧 *Problemas com E-mail / Outlook*\n\nTente estas etapas:\n1. *Feche e reabra* o Outlook\n2. Verifique sua *conexão com a internet* primeiro\n3. Verifique se sua *caixa de entrada não está cheia* (Outlook avisa na barra inferior)\n4. Tente acessar pelo *navegador*: abra o Chrome/Edge e acesse o webmail institucional\n\n⚠️ Reconfigurar a conta de e-mail requer permissão da TI.\n\nSeu problema foi resolvido?`,
    nivel: 0,
    categoria: 'E-mail'
  }
];

// ─── DEFINIÇÃO DOS NÍVEIS DE SUPORTE ────────────────────────────────────────
const niveisSuporteConfig = {
  N1: {
    nome: 'Suporte Nível 1',
    descricao: 'Problemas de software, configurações básicas e acesso',
    prazo: '2 horas',
    cor: '#22c55e',
    palavrasChave: ['office', 'word', 'excel', 'powerpoint', 'software', 'programa', 'instalar',
      'desinstalar', 'antivírus', 'windows', 'atualização', 'driver', 'bluetooth',
      'audio', 'som', 'microfone', 'webcam', 'câmera', 'pen drive', 'usb']
  },
  N2: {
    nome: 'Suporte Nível 2',
    descricao: 'Falhas de hardware, rede corporativa e sistemas internos',
    prazo: '4 horas',
    cor: '#f59e0b',
    palavrasChave: ['hardware', 'teclado', 'mouse', 'monitor', 'tela', 'não liga', 'desliga sozinho',
      'servidor', 'vpn', 'sistema', 'acesso bloqueado', 'firewall', 'switch',
      'domínio', 'active directory', 'login', 'usuário bloqueado', 'permissão']
  },
  N3: {
    nome: 'Suporte Nível 3',
    descricao: 'Incidentes críticos: servidores, banco de dados e segurança',
    prazo: '1 hora',
    cor: '#ef4444',
    palavrasChave: ['servidor caiu', 'servidor offline', 'banco de dados', 'dados corrompidos',
      'ransomware', 'vírus', 'hackeado', 'vazamento', 'backup', 'restore',
      'sistema fora do ar', 'todos sem acesso', 'crítico', 'urgente', 'emergência',
      'falha geral', 'rede toda', 'secretaria inteira']
  }
};

// ─── FUNÇÃO DE TRIAGEM INTELIGENTE ──────────────────────────────────────────
function analisarChamado(mensagem) {
  const texto = mensagem.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 0a. Sistemas com link direto (ex: SIGED) — resolve no N0 com URL
  for (const item of sistemasComLink) {
    const encontrou = item.palavrasChave.some(kw =>
      texto.includes(kw.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    );
    if (encontrou) {
      return { nivel: 0, solucao: item.solucao, categoria: item.categoria };
    }
  }

  // 0b. Outros sistemas internos sem portal → escala para N1 (TI resolve)
  const ehSistemaInterno = sistemasInternos.some(s =>
    texto.includes(s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
  );
  if (ehSistemaInterno) {
    return { nivel: 1, config: niveisSuporteConfig.N1, motivo: 'sistema_interno' };
  }

  // 1. Verifica se tem solução no Nível 0
  for (const item of baseConhecimento) {
    const encontrou = item.palavrasChave.some(kw => {
      const kwNorm = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return texto.includes(kwNorm);
    });
    if (encontrou) {
      if (item.encaminhar) return { nivel: 1, config: niveisSuporteConfig.N1 };
      return { nivel: 0, solucao: item.solucao, categoria: item.categoria };
    }
  }

  // 2. Verifica N3 (crítico) — prioridade máxima
  const isN3 = niveisSuporteConfig.N3.palavrasChave.some(kw => {
    const kwNorm = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return texto.includes(kwNorm);
  });
  if (isN3) return { nivel: 3, config: niveisSuporteConfig.N3 };

  // 3. Verifica N2
  const isN2 = niveisSuporteConfig.N2.palavrasChave.some(kw => {
    const kwNorm = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return texto.includes(kwNorm);
  });
  if (isN2) return { nivel: 2, config: niveisSuporteConfig.N2 };

  // 4. Verifica N1
  const isN1 = niveisSuporteConfig.N1.palavrasChave.some(kw => {
    const kwNorm = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return texto.includes(kwNorm);
  });
  if (isN1) return { nivel: 1, config: niveisSuporteConfig.N1 };

  // 5. Não identificado — coleta mais informações
  return { nivel: -1 };
}

// ─── GERADOR DE NÚMERO DE CHAMADO ───────────────────────────────────────────
function gerarNumeroChamado() {
  const data = new Date();
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `SEDEL-${ano}${mes}${dia}-${rand}`;
}

// ─── ESTADO DA CONVERSA (em memória — simples) ──────────────────────────────
const sessoes = {};

function obterOuCriarSessao(sessionId) {
  if (!sessoes[sessionId]) {
    sessoes[sessionId] = {
      etapa: 'inicio',
      nome: null,
      matricula: null,
      setor: null,
      descricaoProblema: null,
      classificacao: null,
      numeroChamado: null
    };
  }
  return sessoes[sessionId];
}

// ─── ROTA PRINCIPAL DO BOT ──────────────────────────────────────────────────
app.post('/api/chat', (req, res) => {
  const { mensagem, sessionId } = req.body;
  const sessao = obterOuCriarSessao(sessionId);
  let resposta = '';
  let opcoes = [];
  let tipoChamado = null;

  switch (sessao.etapa) {

    // ── NOVO FLUXO: problema PRIMEIRO, dados pessoais DEPOIS ──────────────────
    // Motivo: se o usuário digitar o problema logo de cara (ex: "esqueci minha
    // senha do SIGED"), o bot não confunde a descrição com o nome da pessoa.

    case 'inicio':
      sessao.etapa = 'aguardando_problema';
      resposta = `👋 Olá! Sou o *assistente virtual de TI da SEDEL*.\n\nEstou aqui para ajudar com seus problemas técnicos.\n\nMe descreva o *problema que está enfrentando*:`;
      break;

    case 'aguardando_problema': {
      sessao.descricaoProblema = mensagem.trim();
      const analise = analisarChamado(mensagem);

      if (analise.nivel === 0) {
        // Problema simples: tenta resolver antes de pedir dados
        sessao.classificacao = analise;
        sessao.etapa = 'autoatendimento_solucao';
        tipoChamado = 'N0';
        resposta = `🤖 Encontrei uma solução para seu problema!\n\n${analise.solucao}`;
        opcoes = ['✅ Sim, resolveu!', '❌ Não resolveu'];
      } else if (analise.nivel === -1) {
        // Não entendeu: pede mais detalhes antes de coletar dados
        sessao.etapa = 'aguardando_detalhes';
        resposta = `Hmm, preciso entender melhor. Pode me dizer:\n\n• Em *qual equipamento* ocorre (computador, notebook)?\n• *Quando* começou?\n• Aparece alguma *mensagem de erro*?`;
      } else {
        // Problema identificado: agora coleta os dados pessoais
        sessao.classificacao = analise;
        sessao.etapa = 'aguardando_nome';
        const config = analise.config;
        const emoji = analise.nivel === 3 ? '🔴' : analise.nivel === 2 ? '🟡' : '🟢';
        tipoChamado = `N${analise.nivel}`;
        if (analise.motivo === 'sistema_interno') {
          resposta = `🔐 *Sistema Interno Detectado*\n\nProblemas com sistemas como SIGED, SIGEF, SEI e outros sistemas corporativos requerem intervenção da equipe de TI.\n\n${emoji} Vou abrir um chamado *${config.nome}* para você.\n\nPara registrar, qual é o seu *nome completo*?`;
        } else {
          resposta = `${emoji} *Problema identificado: ${config.nome}*\n⏱️ Prazo: ${config.prazo}\n\nVou abrir o chamado. Qual é o seu *nome completo*?`;
        }
      }
      break;
    }

    case 'aguardando_nome':
      sessao.nome = mensagem.trim();
      sessao.etapa = 'aguardando_setor';
      resposta = `Olá, *${sessao.nome}*! 😊\n\nEm qual *setor/departamento* você trabalha?`;
      break;

    case 'aguardando_setor':
      sessao.setor = mensagem.trim();
      sessao.etapa = 'confirmando_abertura';
      const cfgSetor = sessao.classificacao?.config || niveisSuporteConfig.N1;
      const emojiSetor = (sessao.classificacao?.nivel || 1) === 3 ? '🔴'
        : (sessao.classificacao?.nivel || 1) === 2 ? '🟡' : '🟢';
      resposta = `Quase lá! Confira os dados antes de confirmar:\n\n👤 *Nome:* ${sessao.nome}\n🏢 *Setor:* ${sessao.setor}\n${emojiSetor} *Nível:* ${cfgSetor.nome}\n⏱️ *Prazo:* ${cfgSetor.prazo}\n📝 *Problema:* ${sessao.descricaoProblema}\n\nDeseja confirmar a abertura?`;
      opcoes = ['✅ Confirmar abertura', '✏️ Corrigir informações'];
      break;

    case 'aguardando_detalhes': {
      sessao.descricaoProblema += '\n' + mensagem.trim();
      const analise2 = analisarChamado(sessao.descricaoProblema);
      sessao.classificacao = analise2.nivel === -1
        ? { nivel: 1, config: niveisSuporteConfig.N1 }
        : analise2;
      sessao.etapa = 'confirmando_abertura';
      const cfg = sessao.classificacao.config || niveisSuporteConfig.N1;
      const emoji = sessao.classificacao.nivel === 3 ? '🔴'
        : sessao.classificacao.nivel === 2 ? '🟡' : '🟢';
      resposta = `${emoji} *Encaminhando para ${cfg.nome}*\n\n📋 ${cfg.descricao}\n⏱️ Prazo: ${cfg.prazo}\n\nDeseja confirmar a abertura do chamado?`;
      opcoes = ['✅ Confirmar abertura', '✏️ Corrigir informações'];
      break;
    }

    case 'autoatendimento_solucao':
      if (mensagem.includes('Sim') || mensagem.includes('resolveu')) {
        sessao.etapa = 'finalizado';
        resposta = `🎉 Ótimo! Fico feliz que o problema foi resolvido!\n\nSe precisar de mais ajuda, é só iniciar uma nova conversa. Bom trabalho! 😊`;
      } else {
        sessao.etapa = 'confirmando_abertura';
        sessao.classificacao = { nivel: 1, config: niveisSuporteConfig.N1 };
        resposta = `Entendido! Vou abrir um chamado para um técnico especializado te ajudar.\n\n🟢 *Suporte Nível 1*\nPrazo: 2 horas\n\nConfirmar abertura?`;
        opcoes = ['✅ Confirmar abertura', '✏️ Corrigir informações'];
      }
      break;

    case 'confirmando_abertura':
      if (mensagem.includes('Confirmar') || mensagem.includes('✅')) {
        sessao.numeroChamado = gerarNumeroChamado();
        sessao.etapa = 'finalizado';
        const nivel = sessao.classificacao.nivel;
        const cfg = sessao.classificacao.config;
        const emoji = nivel === 3 ? '🔴' : nivel === 2 ? '🟡' : '🟢';
        tipoChamado = `N${nivel}`;
        resposta = `✅ *Chamado aberto com sucesso!*\n\n📌 *Número:* \`${sessao.numeroChamado}\`\n👤 *Solicitante:* ${sessao.nome}\n🏢 *Setor:* ${sessao.setor}\n\n${emoji} *Nível:* ${cfg?.nome || 'N1'}\n⏱️ *Prazo:* ${cfg?.prazo || '2 horas'}\n\n📝 *Descrição:*\n${sessao.descricaoProblema}\n\nAnote o número do chamado para acompanhamento. A equipe técnica entrará em contato em breve!`;
      } else {
        sessao.etapa = 'aguardando_problema';
        resposta = `Tudo bem! Descreva novamente o problema com mais detalhes:`;
      }
      break;

    default:
      sessao.etapa = 'inicio';
      resposta = `Olá! Para começar um novo atendimento, me diga seu *nome completo*:`;
  }

  res.json({
    resposta,
    opcoes,
    etapa: sessao.etapa,
    numeroChamado: sessao.numeroChamado || null,
    tipoChamado
  });
});

// ─── ROTA DE RESET DE SESSÃO ────────────────────────────────────────────────
app.post('/api/reset', (req, res) => {
  const { sessionId } = req.body;
  delete sessoes[sessionId];
  res.json({ ok: true });
});

// ─── INICIAR SERVIDOR ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor SEDEL Bot rodando em http://localhost:${PORT}`);
});