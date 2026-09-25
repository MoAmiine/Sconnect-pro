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
const memberController = require('./src/controllers/memberController');
const familyController = require('./src/controllers/familyController');
const registrationController = require('./src/controllers/registrationController');

const serve = serveStatic(path.join(__dirname, 'public'));
const parseFormBody = bodyParser.urlencoded({ extended: false });

  function withParams(handler) {
  return (req, res, params) => {
    req.params = params;
    return handler(req, res, params);
  };
}

router.on('GET', '/', (req, res) => {
  render(res, 'dashboard', { title: 'Tableau de bord' });
});

router.on('GET', '/facilities', facilityController.listFacilities);
router.on('GET', '/facilities/:id/edit', withParams(facilityController.showEditForm));
router.on('POST', '/facilities', facilityController.createFacility);
router.on('POST', '/facilities/:id/update', withParams(facilityController.updateFacility));
router.on('POST', '/facilities/:id/delete', withParams(facilityController.deleteFacility));

router.on('GET', '/associations', associationController.listAssociations);
router.on('GET', '/associations/:id/edit', withParams(associationController.showEditForm));
router.on('POST', '/associations', associationController.createAssociation);
router.on('POST', '/associations/:id/update', withParams(associationController.updateAssociation));
router.on('POST', '/associations/:id/delete', withParams(associationController.deleteAssociation));

router.on('GET', '/activities', activityController.listActivities);
router.on('POST', '/activities', activityController.createActivity);
router.on('POST', '/activities/:id/delete', withParams(activityController.deleteActivity));
router.on('GET', '/activities/:id', withParams(registrationController.showActivityDetail));
router.on('POST', '/registrations/quote', registrationController.showQuote);
router.on('POST', '/registrations', registrationController.confirmRegistration);
router.on('POST', '/registrations/:id/cancel', withParams(registrationController.cancelRegistration));

router.on('GET', '/members', memberController.listMembers);
router.on('POST', '/members', memberController.createMember);
router.on('POST', '/members/:id/delete', withParams(memberController.deleteMember));

router.on('GET', '/families', familyController.listFamilies);
router.on('GET', '/families/:id/edit', withParams(familyController.showEditForm));
router.on('POST', '/families', familyController.createFamily);
router.on('POST', '/families/:id/update', withParams(familyController.updateFamily));
router.on('POST', '/families/:id/delete', withParams(familyController.deleteFamily));

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
  console.log(`Serveur démarré : http://localhost:${PORT}`);
});