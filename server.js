require('dotenv').config();
const http = require('http');
const path = require('path');
const serveStatic = require('serve-static');
const finalhandler = require('finalhandler');

const router = require('./src/core/router');
const { render } = require('./src/core/renderer');
const pool = require('./src/config/db');

const serve = serveStatic(path.join(__dirname, 'public'));

router.on('GET', '/', (req, res) => {
  render(res, 'dashboard', { title: 'Tableau de bord' });
});

const server = http.createServer((req, res) => {
  serve(req, res, (err) => {
    if (err) return finalhandler(req, res)(err);
    router.lookup(req, res);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});