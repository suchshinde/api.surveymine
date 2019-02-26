const express = require('express');
const controller = require('./register.controller');
const auth = require('../../auth/auth.service');
// import auth from '../../auth/auth.service';

const router = express.Router();
/**
 * @swagger
 * definitions:
 *  RegisterBody:           # <----------
 *    type: object
 *    required:
 *      - email
 *      - mobileNo
 *      - firstName
 *      - domain
 *      - fromWhere
 *    properties:
 *      email:
 *        type: string
 *        description: email of user.
 *      mobileNo:
 *        type: string
 *        description: Mobile No of user.
 *      firstName:
 *        type: string
 *        description: firstname of user.
 *      domain:
 *        type: string
 *        description: domain of user.
 *      fromWhere:
 *        type: integer
 *        description: parameter for identifying user 1 for client and 2 for user.
 *  RegisterUserBody:           # <----------
 *    type: object
 *    required:
 *      - email
 *      - mobileNo
 *      - firstName
 *    properties:
 *      email:
 *        type: string
 *        description: email of user.
 *      mobileNo:
 *        type: string
 *        description: Mobile No of user.
 *      firstName:
 *        type: string
 *        description: firstname of user.
 *  generateOTPBody:           # <----------
 *    type: object
 *    required:
 *      - email
 *      - mobileNo
 *      - domain
 *      - fromWhere
 *    properties:
 *      email:
 *        type: string
 *        description: email of user.
 *      mobileNo:
 *        type: string
 *        description: Mobile No of user.
 *      domain:
 *        type: string
 *        description: domain of user.
 *      fromWhere:
 *        type: integer
 *        description: parameter for identifying user 1 for client and 2 for user.
 *  VerifyBody:           # <----------
 *    type: object
 *    required:
 *      - email
 *      - mobileNo
 *      - otp
 *      - domain
 *      - password
 *    properties:
 *      email:
 *        type: string
 *        description: email of user that used during registration.
 *      mobileNo:
 *        type: string
 *        description: Mobile No of user that used during registration.
 *      otp:
 *        type: string
 *        description: OTP that was sent on Mobile or email
 *      domain:
 *        type: string
 *        description: domain of user that used during registration.
 *      password:
 *        type: string
 *        description: password for user account
 *  Success:
 *    type: object
 *    required:
 *      - success
 *      - msg
 *      - email
 *      - mobileNo
 *      - domain
 *    properties:
 *      success:
 *         type: boolean
 *         description: status of request.
 *      msg:
 *         type: string
 *         description: description of status
 *      email:
 *         type: string
 *         description: Email that send during registration
 *      mobileNo:
 *         type: string
 *         description: Mobile No that send during registration
 *      domain:
 *         type: string
 *         description: Domain that send during registration
 *
 */

/**
 * @swagger
 * paths:
 *  /api/register:
 *    post:
 *      tags:
 *       - Register User API
 *      summary: Register User in system
 *      consumes:
 *        - application/json
 *      parameters:
 *        - in: body
 *          name: registerUser
 *          description: Registration of user
 *          schema:
 *            $ref: "#/definitions/RegisterBody"     # <----------
 *      responses:
 *         201:
 *           description: User Create successfully
 *           schema:
 *             $ref: "#/definitions/Success" #
 *         500:
 *           description: Something went wrong
 *           schema:
 *             $ref: "#/definitions/Status" #
 *         403:
 *           description: Account not found
 *           schema:
 *             $ref: "#/definitions/Status" #
 */
router.post('/', controller.index);
/**
 * @swagger
 * paths:
 *  /api/register/verifyotp:
 *    post:
 *      tags:
 *       - Register User API
 *      summary: Verify User that was register
 *      consumes:
 *        - application/json
 *      parameters:
 *        - in: body
 *          name: verifyUser
 *          description: verify user that was register
 *          schema:
 *            $ref: "#/definitions/VerifyBody"     # <----------
 *      responses:
 *         200:
 *           description: password updated successfully
 *           schema:
 *             $ref: "#/definitions/Status" #
 *         500:
 *           description: Something went wrong
 *           schema:
 *             $ref: "#/definitions/Status" #
 *         408:
 *           description: OTP verification time exceed
 *           schema:
 *             $ref: "#/definitions/Status" #
 *         422:
 *           description: OTP is Wrong
 *           schema:
 *             $ref: "#/definitions/Status" #
 *         404:
 *           description: Account not found
 *           schema:
 *             $ref: "#/definitions/Status" #
 */
router.post('/verifyotp', controller.verifyOTP); // verify
/**
 * @swagger
 * paths:
 *  /api/register/user:
 *    post:
 *      tags:
 *       - Register User API
 *      summary: Register User in system
 *      security:
 *        - Bearer: []
 *      consumes:
 *        - application/json
 *      parameters:
 *        - in: body
 *          name: registerUser
 *          description: Registration of user
 *          schema:
 *            $ref: "#/definitions/RegisterUserBody"     # <----------
 *      responses:
 *         201:
 *           description: User Create successfully
 *           schema:
 *             $ref: "#/definitions/Success" #
 *         500:
 *           description: Something went wrong
 *           schema:
 *             $ref: "#/definitions/Status" #
 *         401:
 *           description: Unauthorised access
 *           schema:
 *             $ref: "#/definitions/Status" #
 */
router.post('/user', auth.isAuthenticated, controller.userNewRegister);
// router.post('/user', auth.isAuthenticated, permit('Admin'), controller.userNewRegister);
/**
 * @swagger
 * paths:
 *  /api/register/generateOTP:
 *    post:
 *      tags:
 *       - Register User API
 *      summary: generate OTP to verify account
 *      consumes:
 *        - application/json
 *      parameters:
 *        - in: body
 *          name: generateOTP
 *          description: Registration of user
 *          schema:
 *            $ref: "#/definitions/generateOTPBody"     # <----------
 *      responses:
 *         201:
 *           description: OTP generate successfully
 *           schema:
 *             $ref: "#/definitions/Success" #
 *         500:
 *           description: Something went wrong
 *           schema:
 *             $ref: "#/definitions/Status" #
 *         403:
 *           description: Account not found
 *           schema:
 *             $ref: "#/definitions/Status" #
 */
router.post('/generateOTP', controller.generateOTP);
// router.post('/setpassword', controller.setPassword);

module.exports = router;
