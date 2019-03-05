/**
 * @Module Notofication Engine
 * @Developer Sudattakumar Kamble
 * @Designation Software Engineer
 * @Company MobiNext Technologies Private Limited
 * @StartDate 4 Oct 2018
 * @LastModifiedDate 15 Oct 2018
 */
const express = require('express');
const controller = require('./notifications.controller');
const auth = require('../../auth/auth.service');

const router = express.Router();

router.post('/channels', controller.saveEmailSms);
router.post('/screen', auth.isAuthenticated, controller.saveScreen);
router.post('/templates', controller.saveTemplates);
router.post('/addNotificationTypes', controller.addNotificationType);
router.get('/web', auth.isAuthenticated, controller.find); // get screen notifications
router.get('/searchWeb', auth.isAuthenticated, controller.searchInNotifyWeb);
router.patch('/', controller.update);
// router.get('/pub', auth.isAuthenticated, controller.nt);
router.get('/mob/:projectId', auth.isAuthenticated, controller.findM);
router.get('/searchInNotification', auth.isAuthenticated, controller.searchInNotification);

module.exports = router;
