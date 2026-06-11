const { all } = require('../database/database');

async function listarChamados() {
  return all('SELECT * FROM chamados ORDER BY id DESC');
}

async function gerarCsvChamados() {
  const rows = await listarChamados();
  let csv = '\uFEFF';
  csv += 'ID;Numero_Chamado;Solicitante;Setor;Nivel_Suporte;Prazo;Status;Data_Abertura;Descricao_Problema\n';

  rows.forEach((chamado) => {
    const descricaoLimpa = chamado.descricao ? chamado.descricao.replace(/\n/g, ' ') : '';
    csv += `${chamado.id};${chamado.numero};${chamado.solicitante};${chamado.setor};${chamado.nivel};${chamado.prazo};${chamado.status};${chamado.data_abertura};${descricaoLimpa}\n`;
  });

  return csv;
}

module.exports = {
  listarChamados,
  gerarCsvChamados
};
