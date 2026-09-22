const FindMyWay = require('find-my-way');
const { renderError } = require('./renderer');

const router = FindMyWay({
  defaultRoute: (req, res) => {
    renderError(res, 404, "Cette page n'existe pas.");
  }
});

module.exports = router;
