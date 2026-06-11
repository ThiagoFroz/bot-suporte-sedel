CREATE TABLE IF NOT EXISTS chamados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero TEXT UNIQUE,
  solicitante TEXT,
  setor TEXT,
  nivel TEXT,
  prazo TEXT,
  descricao TEXT,
  status TEXT DEFAULT 'Pendente',
  data_abertura TEXT
);
