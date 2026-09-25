# Bot de Suporte SEDEL

**Fork de [uRafa1/bot-suporte-sedel](https://github.com/uRafa1/bot-suporte-sedel)** usado para estudo de um fluxo de triagem de chamados de TI. Esta cópia contém uma interface web e um servidor Express que conduz a conversa, classifica descrições por palavras-chave e registra chamados em SQLite. A classificação por regras não substitui uma avaliação humana e os prazos exibidos são textos de demonstração, não um compromisso de atendimento.

## Executar localmente

Requer Node.js e npm.

```bash
git clone https://github.com/ThiagoFroz/bot-suporte-sedel.git
cd bot-suporte-sedel/backend
npm install
npm start
```

O servidor inicia em `http://localhost:3000` por padrão. A interface está em `index.html` na raiz do repositório; abra-a em um servidor local e ajuste o endereço da API conforme necessário. Consulte `backend/server.js` para as rotas `/api/chat`, `/api/reset` e `/api/chamados/exportar`.

## Estado do projeto

Este é um experimento acadêmico, sem autenticação na API de exportação e sem preparação para uso com dados reais. A cópia do repositório contém um arquivo SQLite e `node_modules` versionados; não reutilize esses dados, instale dependências com `npm install` e evite publicar informações pessoais. Para mudanças e autoria, consulte o projeto original e o histórico deste fork.
