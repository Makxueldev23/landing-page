// server.js
// Servidor simples para servir o site estático ECA Digital (HTML/CSS/JS).

const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 8080;

// Compacta as respostas (ajuda performance/Lighthouse)
app.use(compression());

// Serve os arquivos estáticos da mesma pasta (index.html, style.css, script.js)
app.use(express.static(path.join(__dirname), {
  extensions: ['html'],
  maxAge: '1d', // cache básico para assets estáticos
}));

// Qualquer rota não encontrada volta para a página inicial
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ ECA Digital rodando em http://localhost:${PORT}`);
});