const express = require('express');
const chatController = require('../controllers/chat.controller');

const router = express.Router();

router.post('/', chatController.enviarMensagem);
router.post('/reset', chatController.resetarConversa);

module.exports = router;
