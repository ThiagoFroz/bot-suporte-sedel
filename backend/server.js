const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));

// ─── CONFIGURAÇÃO E INTEGRAÇÃO DO BANCO DE DADOS (SQLITE) ───────────────────
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./chamados.db', (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('📦 Conectado ao banco de dados SQLite local.');
  }
});

// Cria a estrutura correta com todas as colunas necessárias para o relatório
db.run(`
  CREATE TABLE IF NOT EXISTS chamados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT UNIQUE,
    solicitante TEXT,
    setor TEXT,
    nivel TEXT,
    prazo TEXT,
    descricao TEXT,
    status TEXT DEFAULT 'Pendente',
    data_abertura TEXT
  )
`);

// ─── DEFINIÇÃO DOS NÍVEIS DE SUPORTE E PALAVRAS-CHAVE ────────────────────────
const niveisSuporteConfig = {
  N1: {
    nome: 'Suporte Nível 1',
    descricao: 'Problemas de software, configurações básicas, e-mail e desempenho',
    prazo: 'em até 30 minutos',
    cor: '#22c55e',
    palavrasChave: [
      'office', 'word', 'excel', 'powerpoint', 'software', 'programa', 'instalar',
      'desinstalar', 'antivírus', 'windows', 'atualização', 'driver', 'bluetooth',
      'audio', 'som', 'microfone', 'webcam', 'câmera', 'pen drive', 'usb',
      'lento', 'travando', 'devagar', 'pasta da rede', 'mapear', 'wifi', 'travado'
    ]
  },
  N2: {
    nome: 'Suporte Nível 2',
    descricao: 'Falhas de hardware, conectividade de rede local e sistemas internos',
    prazo: 'em até 20 minutos',
    cor: '#f59e0b',
    palavrasChave: [
      'hardware', 'teclado', 'mouse', 'monitor', 'tela', 'não liga', 'desliga sozinho',
      'servidor', 'siged', 'sistema', 'acesso bloqueado', 'senha', 'switch',
      'domínio', 'impressora', 'login', 'usuário bloqueado', 'permissão',
      'sigef', 'sisp', 'sefin', 'rede', 'sei', 'sgp', 'sistema interno',
      'sistema da secretaria', 'papel', 'ponto eletrônico', 'contracheque',
      'senha do windows', 'erro', 'senha expirou', 'trocar senha do windows',
      'imprimir', 'toner', 'impressão', 'não imprime',
      'internet', 'sinstalar', 'sem acesso', 'não carrega', 'página não abre'
    ]
  },
  N3: {
    nome: 'Suporte Nível 3',
    descricao: 'Incidentes críticos: infraestrutura de servidores, banco de dados e segurança',
    prazo: 'em até 10 minutes',
    cor: '#ef4444',
    palavrasChave: [
      'servidor caiu', 'banco de dados', 'dados corrompidos',
      'ransomware', 'vírus', 'hackeado', 'secretario', 'gabinete', 'restore',
      'sistema fora do ar', 'sem acesso', 'crítico', 'urgente', 'emergência',
      'falha geral', 'rede toda', 'secretaria inteira'
    ]
  }
};

// ─── FUNÇÃO DE TRIAGEM INTELIGENTE ──────────────────────────────────────────
function analisarChamado(mensagem) {
  const texto = messageNormalize(mensagem);

  if (niveisSuporteConfig.N3.palavrasChave.some(kw => texto.includes(messageNormalize(kw)))) {
    return { nivel: 3, config: niveisSuporteConfig.N3 };
  }
  if (niveisSuporteConfig.N2.palavrasChave.some(kw => texto.includes(messageNormalize(kw)))) {
    return { nivel: 2, config: niveisSuporteConfig.N2 };
  }
  if (niveisSuporteConfig.N1.palavrasChave.some(kw => texto.includes(messageNormalize(kw)))) {
    return { nivel: 1, config: niveisSuporteConfig.N1 };
  }

  return { nivel: -1 };
}

function messageNormalize(text) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
    case 'inicio':
      sessao.etapa = 'aguardando_nome';
      resposta = `Central de Atendimento de TI - SEDEL\n\nPara iniciar o seu atendimento, por favor, informe o seu nome completo:`;
      break;

    case 'aguardando_nome':
      sessao.nome = mensagem.trim();
      sessao.etapa = 'aguardando_setor';
      resposta = `Solicitante registrado: ${sessao.nome}\n\nPor favor, informe o seu setor ou departamento de trabalho:`;
      break;

    case 'aguardando_setor':
      sessao.setor = mensagem.trim();
      sessao.etapa = 'aguardando_problema';
      resposta = `Setor registrado: ${sessao.setor}\n\nPor favor, informe detalhadamente o problema técnico que está enfrentando:`;
      break;

    case 'aguardando_problema': {
      sessao.descricaoProblema = mensagem.trim();
      const analise = analisarChamado(mensagem);

      if (analise.nivel === -1) {
        sessao.etapa = 'aguardando_detalhes';
        resposta = `Por favor, forneça mais detalhes sobre o problema para classificação adequada:\n\n• Qual equipamento é afetado (computador, notebook, impressora)?\n• Quando o erro começou a ocorrere?\n• É exibida alguma mensagem ou código de erro específico na tela?`;
      } else {
        sessao.classificacao = analise;
        sessao.etapa = 'confirmando_abertura';
        const config = analise.config;
        tipoChamado = `N${analise.nivel}`;
        
        resposta = `Atendimento Identificado: ${config.nome}\nPrazo estimado: ${config.prazo}\n\nConfirmação de dados do chamado:\n\n• Solicitante: ${sessao.nome}\n• Setor: ${sessao.setor}\n• Classificação: ${config.nome}\n• Prazo estimado: ${config.prazo}\n• Descrição: ${sessao.descricaoProblema}\n\nConfirmar a abertura desta solicitação técnica?`;
        opcoes = ['Confirmar abertura', 'Corrigir informações'];
      }
      break;
    }

    case 'aguardando_detalhes': {
      sessao.descricaoProblema += '\n' + mensagem.trim();
      const analise2 = analisarChamado(sessao.descricaoProblema);
      
      sessao.classificacao = analise2.nivel === -1
        ? { nivel: 1, config: niveisSuporteConfig.N1 }
        : analise2;
        
      sessao.etapa = 'confirmando_abertura';
      const cfg = sessao.classificacao.config;
      tipoChamado = `N${sessao.classificacao.nivel}`;
      
      resposta = `Confirmação de dados do chamado:\n\n• Solicitante: ${sessao.nome}\n• Setor: ${sessao.setor}\n• Classificação: ${cfg.nome}\n• Prazo estimado: ${cfg.prazo}\n• Descrição: ${sessao.descricaoProblema}\n\nConfirmar a abertura do chamado técnico?`;
      opcoes = ['Confirmar abertura', 'Corrigir informações'];
      break;
    }

    case 'confirmando_abertura':
      if (mensagem.includes('Confirmar')) {
        sessao.numeroChamado = gerarNumeroChamado();
        sessao.etapa = 'finalizado';
        const nivel = sessao.classificacao.nivel;
        const cfg = sessao.classificacao.config;
        tipoChamado = `N${nivel}`;
        
        const dataAbertura = new Date().toLocaleString('pt-BR', { timeZone: 'America/Manaus' });

        // Executa a gravação manual dos dados estruturados no SQLite
        const sqlInsert = `
          INSERT INTO chamados (numero, solicitante, setor, nivel, prazo, descricao, data_abertura)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(sqlInsert, [
          sessao.numeroChamado,
          sessao.nome,
          sessao.setor,
          cfg.nome,
          cfg.prazo,
          sessao.descricaoProblema,
          dataAbertura
        ], (err) => {
          if (err) {
            console.error(`❌ Erro ao gravar chamado ${sessao.numeroChamado}:`, err.message);
          } else {
            console.log(`💾 Chamado ${sessao.numeroChamado} salvo com sucesso no SQLite.`);
          }
        });
        
        resposta = `Chamado registrado com sucesso.\n\n• Número do chamado: \`${sessao.numeroChamado}\`\n• Solicitante: ${sessao.nome}\n• Setor: ${sessao.setor}\n• Classificação: ${cfg.nome}\n• Prazo de atendimento: ${cfg.prazo}\n\nDescrição do Incidente:\n${sessao.descricaoProblema}\n\nPor favor, guarde o número do chamado para fins de acompanhamento. A equipe técnica entrará em contato.`;
      } else {
        sessao.etapa = 'aguardando_nome';
        resposta = `Por favor, reinicie o preenchimento dos dados informando o seu nome completo:`;
      }
      break;

    default:
      sessao.etapa = 'inicio';
      resposta = `Para iniciar um novo atendimento, por favor, informe o seu nome completo:`;
  }

  res.json({
    resposta,
    opcoes,
    etapa: sessao.etapa, // Corrigido o typo aqui de session para sessao
    numeroChamado: sessao.numeroChamado || null,
    tipoChamado
  });
});

// ─── ROTA DE RELATÓRIO DO EXCEL (EXPORTAÇÃO EM PLANILHA CSV) ────────────────
app.get('/api/chamados/exportar', (req, res) => {
  db.all(`SELECT * FROM chamados ORDER BY id DESC`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio_chamados_sedel.csv');

    let csv = '\uFEFF'; 
    csv += 'ID;Numero_Chamado;Solicitante;Setor;Nivel_Suporte;Prazo;Status;Data_Abertura;Descricao_Problema\n';

    rows.forEach(chamado => {
      const descricaoLimpa = chamado.descricao ? chamado.descricao.replace(/\n/g, ' ') : '';
      csv += `${chamado.id};${chamado.numero};${chamado.solicitante};${chamado.setor};${chamado.nivel};${chamado.prazo};${chamado.status};${chamado.data_abertura};${descricaoLimpa}\n`;
    });

    res.send(csv);
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