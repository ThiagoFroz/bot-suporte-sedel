module.exports = function errorHandler(err, req, res, next) {
  console.error('Erro na aplicacao:', err);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(err.status || 500).json({
    erro: err.message || 'Erro interno do servidor'
  });
};
