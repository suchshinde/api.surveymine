'use strict';

var express = require('express');
const auth = require('../../auth/auth.service');

var controller = require('./template.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/:catagoryId', auth.isAuthenticated, controller.getTemplateByCatagory);
/* template New created*/
router.post('/', auth.isAuthenticated, controller.createNewTemplate);
router.put('/:id', controller.upsert);
router.patch('/:id', controller.patch);
router.delete('/:id', controller.destroy);

// router.post('/', auth.isAuthenticated, controller.createSurvey);

module.exports = router;
