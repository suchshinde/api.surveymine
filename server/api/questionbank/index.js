/**
 * Created by swati on 2/4/19.
 */
var express = require('express');
var controller = require('./questionbank.controller');
const auth = require('../../auth/auth.service');
var router = express.Router();

/* Save Question Bank*/
router.post('/', auth.isAuthenticated, controller.createNewQuestionBank);

module.exports = router;


