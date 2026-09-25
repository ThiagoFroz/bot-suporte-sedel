# Bot de Suporte SEDEL

**Fork de [uRafa1/bot-suporte-sedel](https://github.com/uRafa1/bot-suporte-sedel)** usado para estudar um fluxo de triagem de chamados de TI. A cópia contém uma interface web e um servidor Express que conduz a conversa, classifica descrições por palavras-chave e registra chamados em SQLite. A classificação por regras não substitui avaliação humana; os prazos exibidos são textos de demonstração.

## Executar localmente

Requer Node.js e npm.

```bash
git clone https://github.com/ThiagoFroz/bot-suporte-sedel.git
cd bot-suporte-sedel/backend
npm install
npm start
```

O servidor inicia em `http://localhost:3000` por padrão. A interface fica no arquivo `index.html` na raiz do projeto; sirva a página localmente e ajuste o endereço da API conforme necessário. Consulte `backend/server.js` para as rotas `/api/chat`, `/api/reset` e `/api/chamados/exportar`.

## Estado do projeto

Este é um experimento acadêmico, sem autenticação na API de exportação e sem preparação para uso com dados reais. Um arquivo SQLite já esteve versionado e permanece no histórico do Git; não use os dados antigos. `node_modules` também foi versionado e ainda está no histórico e no ramo atual: instale dependências com `npm install`. Para mudanças e autoria, consulte o projeto original e o histórico deste fork.
