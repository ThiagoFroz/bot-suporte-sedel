const chamadosService = require('../services/chamados.service');

async function dashboard(req, res, next) {
  try {
    const chamados = await chamadosService.listarChamados();
    const resumo = chamados.reduce((acc, chamado) => {
      acc.total += 1;
      acc.pendentes += chamado.status === 'Pendente' ? 1 : 0;
      acc.porNivel[chamado.nivel] = (acc.porNivel[chamado.nivel] || 0) + 1;
      return acc;
    }, { total: 0, pendentes: 0, porNivel: {} });

    return res.json({ resumo, chamados });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  dashboard
};
