const express = require('express');
const cors = require('cors');
const path = require('path');

const env = require('./config/env');
const logger = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');
const chatRoutes = require('./routes/chat.routes');
const chamadosRoutes = require('./routes/chamados.routes');
const adminRoutes = require('./routes/admin.routes');
const { initDatabase } = require('./database/database');

const app = express();

initDatabase();

app.use(cors());
app.use(express.json());
app.use(logger);
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use('/api/chat', chatRoutes);
app.use('/api/chamados', chamadosRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

app.listen(env.port, env.host, () => {
  console.log(`Servidor SEDEL Bot rodando em http://${env.host}:${env.port}`);
});
