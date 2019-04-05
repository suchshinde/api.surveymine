'use strict';

var express = require('express');
var controller = require('./catagory.controller');
const auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.isAuthenticated, controller.getCatagoryList);
router.get('/:id', controller.show);
router.post('/', auth.isAuthenticated, controller.addCatagory);
router.put('/:id', controller.upsert);
router.patch('/:id', controller.patch);
// router.delete('/:id', auth.isAuthenticated, controller.deleteCatagory);
router.post('/:catagoryId', auth.isAuthenticated, controller.updateCatagory);

module.exports = router;
