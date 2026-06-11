const chatService = require('../services/chat.service');

async function enviarMensagem(req, res, next) {
  try {
    const resposta = await chatService.processarMensagem(req.body);
    return res.json(resposta);
  } catch (err) {
    return next(err);
  }
}

function resetarConversa(req, res, next) {
  try {
    chatService.resetarSessao(req.body.sessionId);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  enviarMensagem,
  resetarConversa
};
