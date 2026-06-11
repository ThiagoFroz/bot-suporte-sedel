const niveisSuporteConfig = {
  N1: {
    nome: 'Suporte Nivel 1',
    descricao: 'Problemas de software, configuracoes basicas, e-mail e desempenho',
    prazo: 'em ate 30 minutos',
    cor: '#22c55e',
    palavrasChave: [
      'office', 'word', 'excel', 'powerpoint', 'software', 'programa', 'instalar',
      'desinstalar', 'antivirus', 'windows', 'atualizacao', 'driver', 'bluetooth',
      'audio', 'som', 'microfone', 'webcam', 'camera', 'pen drive', 'usb',
      'lento', 'travando', 'devagar', 'pasta da rede', 'mapear', 'wifi', 'travado'
    ]
  },
  N2: {
    nome: 'Suporte Nivel 2',
    descricao: 'Falhas de hardware, conectividade de rede local e sistemas internos',
    prazo: 'em ate 20 minutos',
    cor: '#f59e0b',
    palavrasChave: [
      'hardware', 'teclado', 'mouse', 'monitor', 'tela', 'nao liga', 'desliga sozinho',
      'servidor', 'siged', 'sistema', 'acesso bloqueado', 'senha', 'switch',
      'dominio', 'impressora', 'login', 'usuario bloqueado', 'permissao',
      'sigef', 'sisp', 'sefin', 'rede', 'sei', 'sgp', 'sistema interno',
      'sistema da secretaria', 'papel', 'ponto eletronico', 'contracheque',
      'senha do windows', 'erro', 'senha expirou', 'trocar senha do windows',
      'imprimir', 'toner', 'impressao', 'nao imprime',
      'internet', 'sem acesso', 'nao carrega', 'pagina nao abre'
    ]
  },
  N3: {
    nome: 'Suporte Nivel 3',
    descricao: 'Incidentes criticos: infraestrutura de servidores, banco de dados e seguranca',
    prazo: 'em ate 10 minutos',
    cor: '#ef4444',
    palavrasChave: [
      'servidor caiu', 'banco de dados', 'dados corrompidos',
      'ransomware', 'virus', 'hackeado', 'secretario', 'gabinete', 'restore',
      'sistema fora do ar', 'sem acesso', 'critico', 'urgente', 'emergencia',
      'falha geral', 'rede toda', 'secretaria inteira'
    ]
  }
};

function normalizar(texto = '') {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function analisarChamado(mensagem) {
  const texto = normalizar(mensagem);

  if (niveisSuporteConfig.N3.palavrasChave.some((kw) => texto.includes(normalizar(kw)))) {
    return { nivel: 3, config: niveisSuporteConfig.N3 };
  }

  if (niveisSuporteConfig.N2.palavrasChave.some((kw) => texto.includes(normalizar(kw)))) {
    return { nivel: 2, config: niveisSuporteConfig.N2 };
  }

  if (niveisSuporteConfig.N1.palavrasChave.some((kw) => texto.includes(normalizar(kw)))) {
    return { nivel: 1, config: niveisSuporteConfig.N1 };
  }

  return { nivel: -1 };
}

module.exports = {
  niveisSuporteConfig,
  analisarChamado
};
