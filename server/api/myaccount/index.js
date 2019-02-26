const express = require('express');
const controller = require('./myaccount.controller');
const auth = require('../../auth/auth.service');

const router = express.Router();

router.get('/', auth.isAuthenticated, controller.accountDetail);
router.post('/upgrade', auth.isAuthenticated, controller.upgrade);
router.post('/payEarly', auth.isAuthenticated, controller.payEarly);
router.get('/billingDetails', auth.isAuthenticated, controller.billingDetails);
router.post('/reportIssue', auth.isAuthenticated, controller.reportIssue);
router.get('/getIssueType', auth.isAuthenticated, controller.getIssueType);
router.post('/changePassword', auth.isAuthenticated, controller.changePassword);


module.exports = router;
