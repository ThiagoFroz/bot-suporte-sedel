const { run } = require('../database/database');
const { analisarChamado, niveisSuporteConfig } = require('./classificacao.service');

const sessoes = {};

function gerarNumeroChamado() {
  const data = new Date();
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `SEDEL-${ano}${mes}${dia}-${rand}`;
}

function obterOuCriarSessao(sessionId) {
  const id = sessionId || 'sessao_padrao';

  if (!sessoes[id]) {
    sessoes[id] = {
      etapa: 'inicio',
      nome: null,
      setor: null,
      descricaoProblema: null,
      classificacao: null,
      numeroChamado: null
    };
  }

  return sessoes[id];
}

async function salvarChamado(sessao) {
  const cfg = sessao.classificacao.config;
  const dataAbertura = new Date().toLocaleString('pt-BR', { timeZone: 'America/Manaus' });

  await run(`
    INSERT INTO chamados (numero, solicitante, setor, nivel, prazo, descricao, data_abertura)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    sessao.numeroChamado,
    sessao.nome,
    sessao.setor,
    cfg.nome,
    cfg.prazo,
    sessao.descricaoProblema,
    dataAbertura
  ]);
}

async function processarMensagem({ mensagem = '', sessionId }) {
  const sessao = obterOuCriarSessao(sessionId);
  let resposta = '';
  let opcoes = [];
  let tipoChamado = null;

  switch (sessao.etapa) {
    case 'inicio':
      sessao.etapa = 'aguardando_nome';
      resposta = 'Central de Atendimento de TI - SEDEL\n\nPara iniciar o seu atendimento, por favor, informe o seu nome completo:';
      break;

    case 'aguardando_nome':
      sessao.nome = mensagem.trim();
      sessao.etapa = 'aguardando_setor';
      resposta = `Solicitante registrado: ${sessao.nome}\n\nPor favor, informe o seu setor ou departamento de trabalho:`;
      break;

    case 'aguardando_setor':
      sessao.setor = mensagem.trim();
      sessao.etapa = 'aguardando_problema';
      resposta = `Setor registrado: ${sessao.setor}\n\nPor favor, informe detalhadamente o problema tecnico que esta enfrentando:`;
      break;

    case 'aguardando_problema': {
      sessao.descricaoProblema = mensagem.trim();
      const analise = analisarChamado(mensagem);

      if (analise.nivel === -1) {
        sessao.etapa = 'aguardando_detalhes';
        resposta = 'Por favor, forneca mais detalhes sobre o problema para classificacao adequada:\n\n- Qual equipamento e afetado (computador, notebook, impressora)?\n- Quando o erro comecou a ocorrer?\n- E exibida alguma mensagem ou codigo de erro especifico na tela?';
      } else {
        sessao.classificacao = analise;
        sessao.etapa = 'confirmando_abertura';
        tipoChamado = `N${analise.nivel}`;
        const config = analise.config;

        resposta = `Atendimento Identificado: ${config.nome}\nPrazo estimado: ${config.prazo}\n\nConfirmacao de dados do chamado:\n\n- Solicitante: ${sessao.nome}\n- Setor: ${sessao.setor}\n- Classificacao: ${config.nome}\n- Prazo estimado: ${config.prazo}\n- Descricao: ${sessao.descricaoProblema}\n\nConfirmar a abertura desta solicitacao tecnica?`;
        opcoes = ['Confirmar abertura', 'Corrigir informacoes'];
      }
      break;
    }

    case 'aguardando_detalhes': {
      sessao.descricaoProblema += `\n${mensagem.trim()}`;
      const analise = analisarChamado(sessao.descricaoProblema);
      sessao.classificacao = analise.nivel === -1 ? { nivel: 1, config: niveisSuporteConfig.N1 } : analise;
      sessao.etapa = 'confirmando_abertura';
      tipoChamado = `N${sessao.classificacao.nivel}`;
      const cfg = sessao.classificacao.config;

      resposta = `Confirmacao de dados do chamado:\n\n- Solicitante: ${sessao.nome}\n- Setor: ${sessao.setor}\n- Classificacao: ${cfg.nome}\n- Prazo estimado: ${cfg.prazo}\n- Descricao: ${sessao.descricaoProblema}\n\nConfirmar a abertura do chamado tecnico?`;
      opcoes = ['Confirmar abertura', 'Corrigir informacoes'];
      break;
    }

    case 'confirmando_abertura':
      if (mensagem.toLowerCase().includes('confirmar')) {
        sessao.numeroChamado = gerarNumeroChamado();
        sessao.etapa = 'finalizado';
        const nivel = sessao.classificacao.nivel;
        const cfg = sessao.classificacao.config;
        tipoChamado = `N${nivel}`;

        await salvarChamado(sessao);

        resposta = `Chamado registrado com sucesso.\n\n- Numero do chamado: \`${sessao.numeroChamado}\`\n- Solicitante: ${sessao.nome}\n- Setor: ${sessao.setor}\n- Classificacao: ${cfg.nome}\n- Prazo de atendimento: ${cfg.prazo}\n\nDescricao do Incidente:\n${sessao.descricaoProblema}\n\nPor favor, guarde o numero do chamado para fins de acompanhamento. A equipe tecnica entrara em contato.`;
      } else {
        sessao.etapa = 'aguardando_nome';
        resposta = 'Por favor, reinicie o preenchimento dos dados informando o seu nome completo:';
      }
      break;

    default:
      sessao.etapa = 'inicio';
      resposta = 'Para iniciar um novo atendimento, por favor, informe o seu nome completo:';
  }

  return {
    resposta,
    opcoes,
    etapa: sessao.etapa,
    numeroChamado: sessao.numeroChamado || null,
    tipoChamado
  };
}

function resetarSessao(sessionId) {
  delete sessoes[sessionId];
}

module.exports = {
  processarMensagem,
  resetarSessao
};
