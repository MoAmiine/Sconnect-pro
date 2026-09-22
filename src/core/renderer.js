const ejs = require('ejs');
const path = require('path');

function render(res, viewName, data = {}) {
  const viewPath = path.join(__dirname, '..', '..', 'views', 'pages', `${viewName}.ejs`);
  ejs.renderFile(viewPath, data, (err, html) => {
    if (err) {
      console.error('Erreur de rendu EJS :', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Erreur serveur (rendu de la vue)');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });
}

module.exports = { render };

function renderError(res, statusCode, message) {
  const viewPath = path.join(__dirname, '..', '..', 'views', 'error.ejs');
  ejs.renderFile(viewPath, { statusCode, message }, (err, html) => {
    if (err) {
      console.error('Erreur de rendu EJS (error.ejs) :', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Erreur serveur');
      return;
    }
    res.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });
}

module.exports = { render, renderError };