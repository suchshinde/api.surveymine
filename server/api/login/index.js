const express = require('express');
const controller = require('./login.controller');

const router = express.Router();
/**
 * @swagger
 * definitions:
 *  Login:           # <----------
 *    type: object
 *    required:
 *      - domain
 *      - mobileNo
 *      - password
 *    properties:
 *      domain:
 *        type: string
 *      mobileNo:
 *        type: string
 *      password:
 *        type: string
 *  SuccessfulLogin:           # <----------
 *    type: object
 *    required:
 *      - success
 *      - msg
 *      - user
 *      - PM_FirstLogin
 *    properties:
 *      success:
 *         type: boolean
 *         description: status of request.
 *      msg:
 *         type: string
 *         description: description of status
 *      user:
 *        $ref: '#/definitions/User'
 *        description: User information
 *      PM_FirstLogin:
 *         type: boolean
 *         description: Is user login first or not
 *  AlreadyLogin:           # <----------
 *    type: object
 *    required:
 *      - success
 *      - msg
 *      - user
 *      - password
 *    properties:
 *      success:
 *         type: boolean
 *         description: status of request.
 *      msg:
 *         type: string
 *         description: description of status
 *      user:
 *        $ref: '#/definitions/User'
 *        description: User information
 *      password:
 *         type: string
 *         description: Password of login user
 *  User:
 *         type: object
 *         required:
 *          - PM_Client_ID
 *          - PM_User_MobileNumber
 *          - PM_User_Email_ID
 *          - PM_User_DateofRegistration
 *          - PM_Domain
 *          - PM_UserID
 *          - PM_User_Role
 *         properties:
 *            PM_Client_ID:
 *              type: integer
 *              description: Client ID of login user
 *            PM_User_MobileNumber:
 *              type: string
 *              description: Mobile Number of login user
 *            PM_User_Email_ID:
 *              type: string
 *              description: Email ID of login user
 *            PM_User_DateofRegistration:
 *              type: string
 *              description: Date of Registration of login user
 *              format: date-time
 *            PM_Domain:
 *              type: string
 *              description: Domain of login user
 *            PM_UserID:
 *              type: integer
 *              description: User ID of login user
 *            PM_User_Role:
 *              type: string
 *              description: Role of login user
 *  Status:           # <----------
 *    type: object
 *    required:
 *      - success
 *      - msg
 *    properties:
 *      success:
 *         type: boolean
 *         description: status of request.
 *      msg:
 *         type: string
 *         description: description of status
 *  AccoutStatus:           # <----------
 *    type: object
 *    required:
 *      - success
 *      - msg
 *      - user
 *    properties:
 *      success:
 *         type: boolean
 *         description: status of request.
 *      msg:
 *         type: string
 *         description: description of status
 *      user:
 *        $ref: '#/definitions/User'
 *        description: User information
 *  InccorectPassword:           # <----------
 *    type: object
 *    required:
 *      - success
 *      - msg
 *      - forgetPasswordAttempt
 *    properties:
 *      success:
 *         type: boolean
 *         description: status of request.
 *      msg:
 *         type: string
 *         description: description of status
 *      forgetPasswordAttempt:
 *        type: string
 *        description: how many times inccorect enter
 */

/**
 * @swagger
 * paths:
 *  /api/login:
 *    post:
 *      tags:
 *       - LoginAPI
 *      summary: login into system.
 *      consumes:
 *        - application/json
 *      parameters:
 *        - in: body
 *          name: login
 *          description: login to system
 *          schema:
 *            $ref: "#/definitions/Login"     # <----------
 *      responses:
 *         200:
 *           description: OK
 *           headers:
 *             Authorization:
 *               type: string
 *               description: token for session.
 *           schema:
 *             $ref: "#/definitions/SuccessfulLogin" #
 *         208:
 *           description: Already Login
 *           schema:
 *             $ref: "#/definitions/AlreadyLogin" #
 *         401:
 *           description: Unauthorised access
 *           schema:
 *             $ref: "#/definitions/Status" #
 *         500:
 *           description: Something went wrong
 *           schema:
 *             $ref: "#/definitions/Status" #
 *         403:
 *           description: Account is not Activated
 *           schema:
 *             $ref: "#/definitions/AccoutStatus" #
 *         400:
 *           description: Incorrect Password
 *           schema:
 *             $ref: "#/definitions/InccorectPassword" #
 */
router.post('/', controller.index);
router.get('/', controller.getTokenByCode);
router.get('/info', controller.getTokenByInfo);
router.post('/sendOtp', controller.sendMobileOTP);
router.post('/sendDomains', controller.sendDomains);
router.post('/mobileLogin', controller.mobileLogin);
module.exports = router;
