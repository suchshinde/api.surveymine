const express = require('express');
const controller = require('./logout.controller');
const auth = require('../../auth/auth.service');

const router = express.Router();
/**
 * @swagger
 * definitions:
 *  ForceLogout:           # <----------
 *    type: object
 *    required:
 *      - UserID
 *      - mobileNo
 *    properties:
 *      UserID:
 *        type: integer
 *      mobileNo:
 *        type: string
 */
/**
 * @swagger
 * paths:
 *  /api/logout:
 *    get:
 *      tags:
 *       - LogoutAPI
 *      summary: LogOut from system.
 *      security:
 *        - Bearer: []
 *      responses:
 *         200:
 *           description: OK
 *           schema:
 *             $ref: "#/definitions/Status" #
 *         500:
 *           description: Something went wrong
 *           schema:
 *             $ref: "#/definitions/Status" #
 *         401:
 *           description: Unauthorised access
 *           schema:
 *             $ref: "#/definitions/Status" #
 */
router.get('/', auth.isAuthenticated, controller.index); // user/get
/**
 * @swagger
 * paths:
 *  /api/logout/forcelogout:
 *    post:
 *      tags:
 *       - LogoutAPI
 *      summary: forcefully logout from system.
 *      consumes:
 *        - application/json
 *      parameters:
 *        - in: body
 *          name: login
 *          description: login to system
 *          schema:
 *            $ref: "#/definitions/ForceLogout"
 *      responses:
 *         200:
 *           description: OK
 *           schema:
 *             $ref: "#/definitions/Status" #
 *         500:
 *           description: Something went wrong
 *           schema:
 *             $ref: "#/definitions/Status" #
 */
router.post('/forcelogout', controller.forceLogout); // user/get


module.exports = router;
