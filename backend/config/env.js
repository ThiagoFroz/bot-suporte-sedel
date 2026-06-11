const path = require('path');

module.exports = {
  host: process.env.HOST || '127.0.0.1',
  port: process.env.PORT || 3000,
  databasePath: process.env.DATABASE_PATH || path.join(__dirname, '..', 'chamados.db')
};
