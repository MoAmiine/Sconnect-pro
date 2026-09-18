const FindMyWay = require('find-my-way');

const router = FindMyWay({
  defaultRoute: (req, res) => {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404 - Page non trouvée</h1>');
  }
});

module.exports = router;