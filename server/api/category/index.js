'use strict';

var express = require('express');
var controller = require('./category.controller');
const auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.isAuthenticated, controller.getCategoryList);
router.get('/:id', controller.show);
router.post('/', auth.isAuthenticated, controller.addCategory);
router.put('/:id', controller.upsert);
router.patch('/:id', controller.patch);
// router.delete('/:id', auth.isAuthenticated, controller.deleteCatagory);
router.post('/:categoryId', auth.isAuthenticated, controller.updateCategory);

module.exports = router;
