const chamadosService = require('../services/chamados.service');

async function listar(req, res, next) {
  try {
    const chamados = await chamadosService.listarChamados();
    return res.json(chamados);
  } catch (err) {
    return next(err);
  }
}

async function exportar(req, res, next) {
  try {
    const csv = await chamadosService.gerarCsvChamados();

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio_chamados_sedel.csv');
    return res.send(csv);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listar,
  exportar
};
