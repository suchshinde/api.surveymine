/* eslint-disable import/prefer-default-export,no-param-reassign,no-unused-vars,max-len,no-plusplus,eqeqeq,no-shadow */
import jwt from 'jsonwebtoken';
import {
    Role,
    Sequelize,
    Permission,
    UserRole,
    RolePermission,
    Menu,
} from '../../sqldb';
import { getMenuData } from '../login/login.controller';
import { getMaxUserAllow } from '../user/user.controller';

import { logger } from '../../components/logger';

const redisClient = require('../../config/redis').redisClient;


function saveMenu(Permissions, ClientID, RoleDescription, Status) {
    if (Status === 1) {
        const permissionArray = Permissions.split(',');
        Menu.findAll({ where: {
                permissionID: permissionArray,
                status: 1,
            },
            raw: true,
            attributes: ['optionID'] }).then((menuArray) => {
            let menuArray1 = menuArray.map(item => item.optionID);
            menuArray1 = [...new Set(menuArray1)];
            getMenuData(menuArray1).then((meunData) => {
                const MenuString = JSON.stringify(meunData);
                redisClient.set(`${ClientID}newMenu${RoleDescription}`, MenuString, (err, reply) => {

                });
            });
        });
    } else {
        redisClient.del(`${ClientID}newMenu${RoleDescription}`, err => true);
    }
    return true;
}
function savePermission(Permissions, IsWeb, IsMobile, ClientID, RoleDescription, Status) {
    if (Status === 1) {
        Permission.findAll({ where: { Status: 1 },
            raw: true,
            attributes: ['ID', 'Description', 'Type'] }).then((obj) => {
                const permissionObj = obj;
                let PermissionArray = Permissions.split(',');
                PermissionArray = PermissionArray.map(Number);
                PermissionArray = PermissionArray.sort((a, b) => a - b);
                PermissionArray.forEach((i) => {
                    permissionObj.forEach((j) => {
                        if (j.ID >= parseInt(i, 10)) {
                            if (j.ID === parseInt(i, 10)) {
                                j.Status = true;
                            } else {
                                j.Status = false;
                            }
                        }
                    });
                });
                const permissionObj1 = JSON.stringify(permissionObj);
                redisClient.set(`${ClientID}newPermission${RoleDescription}`, `${permissionObj1}`, (err, reply) => true);
                return permissionObj;
            },
        );
    } else {
        redisClient.del(`${ClientID}newPermission${RoleDescription}`, err => true);
    }
    // return true;
}
function saveLoginAccess(IsWeb, IsMobile, clientID, Role, Status) {
    if (Status === 1) {
        let Obj = {};
        Obj.IsWeb = IsWeb;
        Obj.IsMobile = IsMobile;
        Obj = JSON.stringify(Obj);
        redisClient.set(`${clientID}newAccess${Role}`, Obj, (err, reply) => true);
    } else {
        redisClient.del(`${clientID}newAccess${Role}`, err => true);
    }
    return true;
}

function getRolePermission(clientID, role, roleID) {
    return new Promise((resolve, reject) => {
        redisClient.get(`${clientID}newPermission${role}`, (err, replyPermission) => {
            if (replyPermission) {
                resolve(JSON.parse(replyPermission));
            } else {
                RolePermission.findAll({ where: {
                        clientID, status: 1, roleID },
                    raw: true,
                    attributes: ['permissionID'] }).then((result) => {
                    let PermissionArray = result.map(item => item.permissionID);
                    Permission.findAll({ where: { Status: 1 },
                        raw: true,
                        attributes: ['ID', 'Description', 'Type'] }).then((obj) => {
                            const permissionObj = obj;
                            // let PermissionArray = Permissions.split(',');
                            PermissionArray = PermissionArray.map(Number);
                            PermissionArray = PermissionArray.sort((a, b) => a - b);
                            PermissionArray.forEach((i) => {
                                permissionObj.forEach((j) => {
                                    if (j.ID >= parseInt(i, 10)) {
                                        j.Status = j.ID === parseInt(i, 10);
                                    }
                                });
                            });
                            permissionObj.forEach((item) => {
                                if (!Object.prototype.hasOwnProperty.call(item, 'Status')) {
                                    item.Status = false;
                                }
                            });
                            resolve(permissionObj);
                            const permissionObj1 = JSON.stringify(permissionObj);
                            redisClient.set(`${clientID}newPermission${role}`, `${permissionObj1}`, (err, reply) => true);
                            return permissionObj;
                        },
                    );
                });
            }
        });
    });
}
function getRoleMenu(clientID, role, roleID) {
    return new Promise((resolve, reject) => {
        redisClient.get(`${clientID}newMenu${role}`, (err, replyMenu) => {
            if (replyMenu) {
                resolve(JSON.parse(replyMenu));
            } else {
                RolePermission.findAll({ where: {
                        roleID,
                        clientID,
                        status: 1,
                    },
                    raw: true,
                    attributes: ['permissionID'],
                }).then((permissionID) => {
                    permissionID = permissionID.map(item => item.permissionID);
                    Menu.findAll({ where: {
                            permissionID,
                            status: 1,
                        },
                        raw: true,
                        attributes: ['optionID'] }).then((menuArray) => {
                        let menuArray1 = menuArray.map(item => item.optionID);
                        menuArray1 = [...new Set(menuArray1)];
                        if (menuArray1.length === 0) {
                            menuArray1.push(0);
                        }
                        getMenuData(menuArray1).then((meunData) => {
                            resolve(meunData);
                            const MenuString = JSON.stringify(meunData);
                            redisClient.set(`${clientID}newMenu${role}`, MenuString, (err, reply) => {
                            });
                        });
                    });
                });
                // Role.findOne({ where: { PM_Client_ID: clientID, Description: role }, raw: true }).then((result) => {
                //   const permissions = result.Permission.split(',');
                //   let filterObj;
                //   let filterArray = [];
                //   Option.findAll({ where: { Status: 1 },
                //     order: [
                //       ['ID', 'ASC'],
                //     ],
                //     attributes: ['ID', 'Description', 'PermissionID', 'RouterLink', 'Icon'],
                //     raw: true },
                //   ).then((obj) => {
                //     permissions.forEach((ID, index) => {
                //       filterObj = obj.filter((e) => {
                //         if (e.PermissionID === 'All') {
                //           return true;
                //         }
                //         const p = e.PermissionID.split(',');
                //         return p.includes(ID);
                //       });
                //       filterObj.forEach((i) => {
                //         if (filterArray.includes(i) === false) filterArray.push(i);
                //       });
                //     });
                //
                //     filterArray = filterArray.sort((a, b) => a.ID - b.ID);
                //     let manageProjectLocation = null;
                //     for (let k = 0; k < filterArray.length; k++) {
                //       if (filterArray[k].ID === 8) {
                //         filterArray[k].subMenu = [];
                //         const subMenuObj = {
                //           subMenuName: 'Manage Project',
                //           RouterLink: filterArray[k].RouterLink,
                //           Icon: filterArray[k].Icon,
                //         };
                //         filterArray[k].subMenu.push(subMenuObj);
                //         manageProjectLocation = k;
                //       } else if (filterArray[k].ID === 9) {
                //         if (manageProjectLocation || manageProjectLocation === 0) {
                //           const subMenuObj = {
                //             subMenuName: 'Create Project',
                //             RouterLink: filterArray[k].RouterLink,
                //             Icon: filterArray[k].Icon,
                //           };
                //           delete filterArray[manageProjectLocation].RouterLink;
                //           filterArray[manageProjectLocation].subMenu[1] = subMenuObj;
                //           filterArray.splice(k, 1);
                //         } else {
                //           filterArray[k].subMenu = [];
                //           const subMenuObj = {
                //             subMenuName: 'Create Project',
                //             RouterLink: filterArray[k].RouterLink,
                //             Icon: filterArray[k].Icon,
                //           };
                //           filterArray[k].subMenu[0] = subMenuObj;
                //         }
                //       }
                //     }
                //     resolve(filterArray);
                //     filterArray = JSON.stringify(filterArray);
                //     redisClient.set(`${clientID}${role}Menu`, `${filterArray}`, err => true);
                //   });
                // }).catch((e) => {
                //   reject(e);
                // });
            }
        });
    });
}
function getRoleLogin(clientID, role) {
    return new Promise((resolve, reject) => {
        redisClient.get(`${clientID}newAccess${role}`, (err, replyLogin) => {
            if (replyLogin) {
                resolve(JSON.parse(replyLogin));
            } else {
                Role.findOne({ where: { PM_Client_ID: clientID, Description: role }, raw: true }).then((result) => {
                    let Obj = {};
                    Obj.IsWeb = result.IsWeb;
                    Obj.IsMobile = result.IsMobile;
                    resolve(Obj);
                    Obj = JSON.stringify(Obj);
                    redisClient.set(`${clientID}newAccess${role}`, Obj, (err, reply) => true);
                });
            }
        });
    });
}
function getRoleCount(clientID) {
    return new Promise((resolve) => {
        Role.count({ where: { PM_Client_ID: clientID, Status: 1 }, raw: true }).then((count) => {
            resolve(count);
        });
    });
}
function createJWTToken(obj, authObj, res, role) {
    const permission = obj.Permission; // .filter(item => item.Status === true);
    let user = {};
    user = authObj;
    user.Permission = permission;
    user.selectRoleID = obj.RoleID;
    user.Menu = obj.Menu;
    user.SelectedRole = role;
    jwt.sign({ user }, process.env.JWT_SECKERT_KEY, (err, token) => {
        if (err) {
            logger.error({
                msg: 'Unauthorised',
                error: err,
            });
            return res.status(401)
                .json({
                    success: false,
                    msg: 'Unauthorised',
                });
        }
        redisClient.set(`${user.PM_User_MobileNumber}login${user.PM_Client_ID}`, `${token}`, (err) => {
            if (err) {
                logger.error({
                    msg: 'Something went wrong',
                    error: err,
                });
                return res.status(500)
                    .json({
                        success: false,
                        msg: 'Something went wrong',
                    });
            }
            // redisClient.expire(`${user.PM_User_MobileNumber}`, process.env.IDEL_SESSION_TIME); // session time in sec
            res.setHeader('Authorization', token);
            obj.token = token;
            return res.json(obj);
        });
        return '';
    });
}
async function checkPlan(clientID) {
    const roleCount = await getRoleCount(clientID);
    const maxRoleAllow = await getMaxUserAllow(clientID);
    return roleCount - 1 <= maxRoleAllow.PLAN_ROLES;
}
function getRoleID(clientID, role) {
    return new Promise((resolve) => {
        Role.findOne({ where: { PM_Client_ID: clientID, Description: role, Status: 1 },
            raw: true,
            attributes: ['ID'] })
            .then((ID) => {
                resolve(ID.ID);
            });
    });
}
async function getMenuPermission(ClientID, role) {
    try {
        const option = {};
        // get permission
        option.RoleID = await getRoleID(ClientID, role);
        option.Permission = await getRolePermission(ClientID, role, option.RoleID);
        // get Menu
        option.Menu = await getRoleMenu(ClientID, role, option.RoleID);

        // get login
        option.LoginAccess = await getRoleLogin(ClientID, role);
        return option;
    } catch (e) {
        return null;
    }
}
// get All role
function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}
export function index(req, res) {
    //req.authData={};
   // req.authData.PM_Client_ID="1";
    let likeCause = '';
    if (req.query.q) {
        likeCause = req.query.q;
    }
    const clientID = req.authData.PM_Client_ID;
    Role.findAll({ where: { Status: 1, PM_Client_ID: req.authData.PM_Client_ID, Description: { [Sequelize.Op.like]: `%${likeCause}%` } },
        order: [
            ['ID', 'DESC'],
        ],
        attributes: ['ID', 'Description', 'Permission', 'IsWeb', 'IsMobile'],
        raw: true,
        include: [{
            model: RolePermission,
            as: 'RoleP',
            attributes: ['permissionID'],
            where: { clientID, status: 1 },
            required: false,
            include: [
                {
                    model: Permission,
                    as: 'Permission2',
                    attributes: ['Description'],
                    where: { Status: 1 },
                    required: false,
                }],

        }] },
    ).then((userRole) => {
        const responseArr = [];
        let RoleObj = {};
        userRole.forEach((item, index) => {
            if (RoleObj.ID === item.ID) {
                const perm = {};
                perm.ID = item['RoleP.permissionID'];
                perm.Description = item['RoleP.Permission2.Description'];
                RoleObj.Permission.push(perm);
                if (index === userRole.length - 1) {
                    responseArr.push(RoleObj);
                }
            } else {
                if (!isEmpty(RoleObj)) {
                    responseArr.push(RoleObj);
                }
                RoleObj = {};
                RoleObj.ID = item.ID;
                RoleObj.Description = item.Description;
                RoleObj.IsMobile = item.IsMobile;
                RoleObj.IsWeb = item.IsWeb;
                RoleObj.isPresent = false;
                RoleObj.Permission = [];
                const perm = {};
                perm.ID = item['RoleP.permissionID'];
                perm.Description = item['RoleP.Permission2.Description'];
                RoleObj.Permission.push(perm);
            }
        });
        if (responseArr.length === 0 && !isEmpty(RoleObj)) {
            responseArr.push(RoleObj);
        }
        if (responseArr.length > 0) {
            responseArr.forEach((item1, index) => {
                UserRole.count({
                    where: {
                        clientID,
                        roleID: item1.ID,
                        status: 1,
                    },
                })
                    .then((count) => {
                        if (count > 0) {
                            item1.isPresent = true;
                        }
                        if (index === responseArr.length - 1) {
                            res.send(responseArr);
                        }
                    });
            });
        } else {
            res.send([]);
        }


        // createPermisison(obj, res, req.authData.PM_Client_ID);
        return null;
    }).catch((err) => {
        console.log(err)
        res.status(500).send({ success: false, msg: 'Something Went Wrong' });
    });
}

export function createRole(req, res) {
    const insertObj = {
        PM_Client_ID:   req.authData.PM_Client_ID,
        Description: req.body.Description,
        IsMobile: req.body.IsMobile,
        IsWeb: req.body.IsWeb,
        Status: 1,
        Permission: req.body.Permission,
    };
    checkPlan(insertObj.PM_Client_ID).then((obj) => {
        if (obj) {
            Role.create(insertObj, { isNewRecord: true })
                .then((x) => {
                    const permissionArr = req.body.Permission.split(',');
                    permissionArr.forEach((ID) => {
                        const rolepermissionObj = {};
                        rolepermissionObj.clientID = insertObj.PM_Client_ID;
                        rolepermissionObj.permissionID = ID;
                        rolepermissionObj.roleID = x.ID;
                        rolepermissionObj.status = 1;
                        RolePermission.create(rolepermissionObj).then((p) => {
                        });
                    });
                    res.status(201)
                        .send({ success: true, msg: 'Role Created Successfully' });
                    savePermission(req.body.Permission, insertObj.IsWeb, insertObj.IsMobile, insertObj.PM_Client_ID, insertObj.Description, 1);
                    saveLoginAccess(insertObj.IsWeb, insertObj.IsMobile, insertObj.PM_Client_ID, insertObj.Description, 1);
                    saveMenu(req.body.Permission, insertObj.PM_Client_ID, insertObj.Description, 1);
                    return null;
                })
                .catch((err) => {
                    res.status(404)
                        .send({ success: false, msg: 'Role not Created Successfully' });
                });
        } else {
            res
                .send({ success: false, msg: 'Reach Max Role Count' });
        }
    });
}
export function getPermission(req, res) {
    Permission.findAll({ where: { Status: true }, attributes: ['ID', 'Description', 'Status'] })
        .then((projects) => {
            res.status(200).send(projects);
        }).catch((err) => {
        res.status(500).send({ success: false, msg: 'Something Went Wrong' });
    });
}

export function updateRole(req, res) {
    const updateObj = {
        Description: req.body.Description,
        IsMobile: req.body.IsMobile,
        IsWeb: req.body.IsWeb,
        Status: req.body.Status,
        Permission: req.body.Permission,
    };
    Role.update(updateObj, { where: { ID: req.body.ID } }).then((obj) => {
        if (obj[0] === 1) {
            RolePermission.update({ status: 0 }, { where: {
                    roleID: req.body.ID,
                    clientID: req.authData.PM_Client_ID,
                } }).then((dd) => {
                if (updateObj.Status) {
                    const permissionArr = req.body.Permission.split(',');
                    permissionArr.forEach((ID, index) => {
                        const rolepermissionObj = {};
                        rolepermissionObj.clientID = req.authData.PM_Client_ID;
                        rolepermissionObj.permissionID = ID;
                        rolepermissionObj.roleID = req.body.ID;
                        rolepermissionObj.status = 1;
                        RolePermission.create(rolepermissionObj)
                            .then((p) => {
                            });
                        if (permissionArr.length - 1 === index) {
                            res.status(202).send({ success: true, msg: 'Role updated Successfully' });
                        }
                    });
                } else {
                    res.status(202).send({ success: true, msg: 'Role Deleted Successfully' });
                }
            });
            saveMenu(updateObj.Permission, req.authData.PM_Client_ID, updateObj.Description, updateObj.Status);
            saveLoginAccess(updateObj.IsWeb, updateObj.IsMobile, req.authData.PM_Client_ID, updateObj.Description, updateObj.Status);
            savePermission(updateObj.Permission, updateObj.IsWeb, updateObj.IsMobile, req.authData.PM_Client_ID, updateObj.Description, updateObj.Status);
            return null;
        } else if (obj[0] === 0) {
            res.status(404).send({ success: false, msg: 'Role Not Found' });
        }
        return true;
    }).catch((err) => {
        res.status(500).send({ success: false, msg: 'Role not updated Successfully' });
    });
}
// get Permission and menu based on role
export function access(req, res) {
    const role = req.params.role;
    getMenuPermission(req.authData.PM_Client_ID, role).then((obj) => {
        createJWTToken(obj, req.authData, res, role);
    }).catch((e) => {
        res.send(e);
    });
}

