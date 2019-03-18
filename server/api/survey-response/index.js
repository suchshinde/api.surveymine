import * as auth from "../../auth/auth.service";

var express = require('express');
var controller = require('./survey-response.controller');

var router = express.Router();

router.get('/', auth.isAuthenticated, controller.index);
router.get('/:id', auth.isAuthenticated, controller.show);
router.post('/', auth.isAuthenticated, controller.createSurveyResponse);
router.put('/:id', auth.isAuthenticated, controller.upsert);
router.patch('/:id', auth.isAuthenticated, controller.patch);
router.delete('/:id', auth.isAuthenticated, controller.destroy);
router.post('/upload', auth.isAuthenticated, controller.uploadFileForAnswer);

module.exports = router;
