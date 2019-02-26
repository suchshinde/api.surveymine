import permit from '../../auth/permission';

const express = require('express');
const controller = require('./user.controller');
const auth = require('../../auth/auth.service');


const router = express.Router();
// auth.isAuthenticated, permit('UserMaster'),
router.get('/', controller.show);//  get all user
//router.get('/getManagerUsers', auth.isAuthenticated, controller.getManagerUsers);
// auth.isAuthenticated,
router.get('/:id', controller.getUser);// user/get
// auth.isAuthenticated, permit('UserMaster'),
router.post('/update', controller.update);//  update user
// router.post('/', auth.isAuthenticated, controller.create);//  add user
router.post('/', controller.createNewUser);// auth.isAuthenticated, permit('UserMaster'),  add user
auth.isAuthenticated,
router.get('/r/role', controller.role);//  get all user
// router.get('/resource/:projectId', auth.isAuthenticated, controller.getOnlyResources);
//router.post('/getUniqueUser', auth.isAuthenticated, controller.getUniqueUser);
module.exports = router;
