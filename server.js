require('dotenv').config();
const http = require('http');
const path = require('path');
const serveStatic = require('serve-static');
const finalhandler = require('finalhandler');
const bodyParser = require('body-parser');

const router = require('./src/core/router');
const { render } = require('./src/core/renderer');
const pool = require('./src/config/db');
const facilityController = require('./src/controllers/facilityController');
const associationController = require('./src/controllers/associationController');
const activityController = require('./src/controllers/activityController');

const serve = serveStatic(path.join(__dirname, 'public'));
const parseFormBody = bodyParser.urlencoded({ extended: false });

router.on('GET', '/', (req, res) => {
  render(res, 'dashboard', { title: 'Tableau de bord' });
});

router.on('GET', '/facilities', facilityController.listFacilities);
router.on('GET', '/facilities/:id/edit', facilityController.showEditForm);
router.on('POST', '/facilities', facilityController.createFacility);
router.on('POST', '/facilities/:id/update', facilityController.updateFacility);
router.on('POST', '/facilities/:id/delete', facilityController.deleteFacility);

router.on('GET', '/associations', associationController.listAssociations);
router.on('GET', '/associations/:id/edit', associationController.showEditForm);
router.on('POST', '/associations', associationController.createAssociation);
router.on('POST', '/associations/:id/update', associationController.updateAssociation);
router.on('POST', '/associations/:id/delete', associationController.deleteAssociation);

router.on('GET', '/activities', activityController.listActivities);
router.on('POST', '/activities', activityController.createActivity);
router.on('POST', '/activities/:id/delete', activityController.deleteActivity);


const server = http.createServer((req, res) => {
  serve(req, res, (err) => {
    if (err) return finalhandler(req, res)(err);

    if (req.method === 'POST') {
      parseFormBody(req, res, () => router.lookup(req, res));
    } else {
      router.lookup(req, res);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`server started : http://localhost:${PORT}`);
});