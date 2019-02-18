import permit from '../../auth/permission';

const express = require('express');
const controller = require('./rolemgm.controller');
const auth = require('../../auth/auth.service');


const router = express.Router();
/**
 * @swagger
 * definitions:
 *  RoleList:           # <----------
 *    type: array
 *    items:
 *      type: object
 *      required:
 *        - ID
 *        - Description
 *        - Permission
 *        - IsWeb
 *        - IsMobile
 *      properties:
 *         ID:
 *           type: integer
 *           description: Role ID.
 *         Description:
 *           type: string
 *           description: Role Name.
 *         Permission:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - ID
 *               - Description
 *             properties:
 *               ID:
 *                 type: integer
 *                 description: Permission ID.
 *               Description:
 *                 type: string
 *                 description: Description of permission.
 *           description: Permission for role.
 *         IsWeb:
 *           type: boolean
 *           description: Is role for web.
 *         IsMobile:
 *           type: boolean
 *           description: Is role for Mobile.
 *    description: Array of role
 *  PermissionList:           # <----------
 *    type: array
 *    items:
 *      type: object
 *      required:
 *        - ID
 *        - Description
 *      properties:
 *         ID:
 *           type: integer
 *           description: Role ID.
 *         Description:
 *           type: string
 *           description: Role Name.
 *    description: Array of role
 *  UpdateRole:           # <----------
 *    type: object
 *    required:
 *      - description
 *      - permission
 *      - isWeb
 *      - isMobile
 *      - ID
 *    properties:
 *      description:
 *        type: string
 *        description: Role Name.
 *      permission:
 *        type: string
 *        description: Permission for role. (This string contain permission ID in comma seperated)
 *      isWeb:
 *        type: boolean
 *        description: Is role for web.
 *      isMobile:
 *        type: boolean
 *        description: Is role for Mobile.
 *      ID:
 *        type: integer
 *        description: Role ID that has to updated
 *  AddRole:           # <----------
 *    type: object
 *    required:
 *      - description
 *      - permission
 *      - isWeb
 *      - isMobile
 *    properties:
 *      description:
 *        type: string
 *        description: Role Name.
 *      permission:
 *        type: string
 *        description: Permission for role. (This string contain permission ID in comma seperated)
 *      isWeb:
 *        type: boolean
 *        description: Is role for web.
 *      isMobile:
 *        type: boolean
 *        description: Is role for Mobile.
 */
/**
 * @swagger
 * paths:
 *  /api/role:
 *    get:
 *      tags:
 *       - Role Management
 *      summary: Get all role for client
 *      security:
 *        - Bearer: []
 *      consumes:
 *        - application/json
 *      responses:
 *         200:
 *           description: All role
 *           schema:
 *             $ref: "#/definitions/RoleList" #
 *         500:
 *           description: Something went wrong
 *           schema:
 *             $ref: "#/definitions/Status" #
 */
//auth.isAuthenticated, permit('UserMaster')
router.get('/', controller.index);
/**
 * @swagger
 * paths:
 *  /api/role:
 *    post:
 *      tags:
 *       - Role Management
 *      summary: Add new role
 *      security:
 *        - Bearer: []
 *      consumes:
 *        - application/json
 *      parameters:
 *        - in: body
 *          name: role
 *          description: role information
 *          schema:
 *            $ref: "#/definitions/AddRole"     # <----------
 *      responses:
 *         201:
 *           description: Role Created Succesfully
 *           schema:
 *             $ref: "#/definitions/Status" #
 *         404:
 *           description: Something went wrong
 *           schema:
 *             $ref: "#/definitions/Status" #
 */
router.post('/',controller.createRole);
/**
 * @swagger
 * paths:
 *  /api/role:
 *    patch:
 *      tags:
 *       - Role Management
 *      summary: Update existing new role
 *      security:
 *        - Bearer: []
 *      consumes:
 *        - application/json
 *      parameters:
 *        - in: body
 *          name: role
 *          description: role information
 *          schema:
 *            $ref: "#/definitions/UpdateRole"     # <----------
 *      responses:
 *         202:
 *           description: Role updated Successfully
 *           schema:
 *             $ref: "#/definitions/Status" #
 *         404:
 *           description: Role Not Found
 *           schema:
 *             $ref: "#/definitions/Status" #
 *         500:
 *           description: Role not updated Successfully
 *           schema:
 *             $ref: "#/definitions/Status" #
 */
router.patch('/', controller.updateRole);
/**
 * @swagger
 * paths:
 *  /api/role/permission:
 *    get:
 *      tags:
 *       - Role Management
 *      summary: Get all permission for client
 *      security:
 *        - Bearer: []
 *      consumes:
 *        - application/json
 *      responses:
 *         200:
 *           description: All role
 *           schema:
 *             $ref: "#/definitions/PermissionList" #
 *         500:
 *           description: Something went wrong
 *           schema:
 *             $ref: "#/definitions/Status" #
 */
router.get('/permission', controller.getPermission);
router.get('/access/:role', auth.isAuthenticated, controller.access);

module.exports = router;
