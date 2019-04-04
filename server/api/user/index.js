import permit from '../../auth/permission';

const express = require('express');
const controller = require('./user.controller');
const auth = require('../../auth/auth.service');

// const router = express.Router();
// router.get('/', auth.isAuthenticated, controller.show);//  get all user permit('UserMaster'),
// router.get('/:id', auth.isAuthenticated, controller.getUser);// user/get
// router.post('/update', auth.isAuthenticated, permit('UserMaster'), controller.update);//  update user
// router.post('/', auth.isAuthenticated, permit('UserMaster'), controller.createNewUser);// auth.isAuthenticated, permit('UserMaster'),  add user
// router.get('/r/role', auth.isAuthenticated, controller.role);//  get all user
// module.exports = router;


const router = express.Router();
router.get('/', auth.isAuthenticated, controller.show);//  get all user permit('UserMaster'),
router.get('/:id', auth.isAuthenticated, controller.getUser);// user/get
router.post('/update', auth.isAuthenticated, controller.update);//  update user
router.post('/', auth.isAuthenticated, controller.createNewUser);// auth.isAuthenticated, permit('UserMaster'),  add user
router.get('/r/role', auth.isAuthenticated, controller.role);//  get all user
router.patch('/forgot/password', controller.forgotPassword);
router.patch('/forgot/password/update', controller.updatePassword);
router.get('/deleteUser/:id', auth.isAuthenticated, controller.deleteUser);/* Delete user */
module.exports = router;
