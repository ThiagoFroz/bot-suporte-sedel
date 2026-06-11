const express = require('express');
const chamadosController = require('../controllers/chamados.controller');

const router = express.Router();

router.get('/', chamadosController.listar);
router.get('/exportar', chamadosController.exportar);

module.exports = router;
