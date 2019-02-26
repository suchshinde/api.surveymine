const express = require('express');
const controller = require('./resource.controller');
const auth = require('../../auth/auth.service');

const router = express.Router();

router.post('/', auth.isAuthenticated, controller.create);
router.get('/:projID/:subprojID/:mileID/:taskID', auth.isAuthenticated, controller.findAll);

module.exports = router;
