var express = require('express');
var controller = require('./survey.controller');
const auth = require('../../auth/auth.service');
var router = express.Router();

router.get('/', auth.isAuthenticated, controller.getAllSurveyByUser);
router.get('/created/by/:search', auth.isAuthenticated, controller.getAllSurveyCreatedByUser);

router.get('/:id', auth.isAuthenticated, controller.show);
/* Publish New Survey*/
router.post('/', auth.isAuthenticated, controller.createSurvey);
/* Save Survey as Draft*/
router.post('/', auth.isAuthenticated, controller.draftSurvey);
router.put('/:id', auth.isAuthenticated, controller.upsert);
router.patch('/:id', auth.isAuthenticated, controller.patch);
router.delete('/:id', auth.isAuthenticated, controller.destroy);

module.exports = router;
