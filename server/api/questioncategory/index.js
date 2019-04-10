/**
 * Created by swati on 10/4/19.
 */

var express = require('express');
var controller = require('./questioncategory.controller');
const auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/', auth.isAuthenticated, controller.addquestionCategory);
router.get('/', auth.isAuthenticated, controller.getQuestionCategoryList);
router.post('/:categoryId', auth.isAuthenticated, controller.updateQuestionCategory);



module.exports = router;

