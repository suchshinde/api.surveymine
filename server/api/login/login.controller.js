/* eslint-disable max-len,consistent-return,no-shadow,import/prefer-default-export,no-unused-vars,no-param-reassign,no-plusplus,dot-notation */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {RegisterUser, LoginSession, Sequelize, Role, Option, Permission, UserRole, RolePermission, Menu} from '../../sqldb';
import {Order, RegisterClient} from '../../sqldb/portal.db';
import {logger} from '../../components/logger';
//import {saveEmailSmsBacked, sendMsg} from '../notifications/notifications.controller';
import {promise} from 'selenium-webdriver';
import otpGenerator from 'otp-generator';
import nodemailer from 'nodemailer';
import SendOtp from 'sendotp';
import moment from 'moment';
import fs from 'fs';
import handlebars from 'handlebars';

const redisClient = require('../../config/redis/').redisClient;

function lockUser(user) {
    RegisterUser.update({PM_User_OTP: null, PM_User_OTPTime: null, PM_User_Status: false, IsLock: true},
        {
            where: {
                PM_User_MobileNumber: user.PM_User_MobileNumber,
                PM_User_Email_ID: user.PM_User_Email_ID,
                PM_Domain: user.PM_Domain
            }
        })
        .then((result) => {
            if(result[0] === 1) {
                // logger
                // console.log('Account is locked');
            }
        })
        .catch((err) => {
            // console.log(err);
        });
}

function createSession(UserID, ClientID, IsMobile, IMEI) {
    const logginSession = {
        TimestampLogin: new Date(),
        UserID,
        ClientID,
        LoginStatus: 1,
        LoginDevice: 'Web',
        TimestampLogout: null,
        IsFailed: 0,
        IMEI: null,
    };
    if(IsMobile) {
        logginSession.LoginDevice = 'Mobile';
        logginSession.IMEI = IMEI;
    }
    LoginSession.create(logginSession)
        .then((x) => {
        })
        .catch((err) => {
        });
}

function failedAttempts(UserID) {
    const logginSession = {
        TimestampLogin: new Date(),
        UserID,
        LoginStatus: 2,
        LoginDevice: 'needtowork',
        TimestampLogout: null,
        IsFailed: 1,
    };
    LoginSession.create(logginSession)
        .then((x) => {
            // console.log(x.dataValues.ID);
        })
        .catch((err) => {
            // console.log(err);
        });
}

function updateFirstLogin(user) {
    // console.log('updatefirst');
    RegisterUser.update({PM_FirstLogin: 0},
        {
            where: {
                PM_User_MobileNumber: user.PM_User_MobileNumber,
                PM_User_Email_ID: user.PM_User_Email_ID,
                PM_Domain: user.PM_Domain
            }
        })
        .then((result) => {
            if(result[0] === 1) {
                // logger
                // console.log('user first login');
            }
        })
        .catch((err) => {
            // console.log(err);
        });
}

// function getRole(clientId) {
//   return new Promise((resolve) => {
//     Role.findAll({ where: { Status: 1, PM_Client_ID: clientId },
//       attributes: ['ID', 'Description', 'IsMobile', 'IsWeb', 'Permission'],
//       raw: true },
//     ).then((obj) => {
//       resolve(obj);
//     });
//   });
// }
// function getPermissionObj() {
//   return [
//     {
//       ID: 1,
//       Description: 'Approve',
//       Status: false,
//     },
//     {
//       ID: 2,
//       Description: 'Data Capture',
//       Status: false,
//     },
//     {
//       ID: 3,
//       Description: 'Sign IN',
//       Status: false,
//     },
//     {
//       ID: 4,
//       Description: 'Reports',
//       Status: false,
//     },
//     {
//       ID: 5,
//       Description: 'Graph Dashboard',
//       Status: false,
//     },
//     {
//       ID: 6,
//       Description: 'Assign',
//       Status: false,
//     },
//     {
//       ID: 7,
//       Description: 'Inputs Costs',
//       Status: false,
//     },
//     {
//       ID: 8,
//       Description: 'Modify Master',
//       Status: false,
//     },
//     {
//       ID: 9,
//       Description: 'Modify User Master',
//       Status: false,
//     },
//     {
//       ID: 10,
//       Description: 'Modify Global Parameters',
//       Status: false,
//     },
//     {
//       ID: 11,
//       Description: 'EVM -Dashboard',
//       Status: false,
//     },
//     {
//       ID: 12,
//       Description: 'Audit',
//       Status: false,
//     },
//   ];
// }
// function getRolePermission(clientID, role) {
//   return new Promise((resolve, reject) => {
//     redisClient.get(`${clientID}${role}Permission`, (err, replyPermission) => {
//       if (replyPermission) {
//         resolve(JSON.parse(replyPermission));
//       } else {
//         Role.findOne({ where: { PM_Client_ID: clientID, Description: role }, raw: true })
//           .then((result) => {
//             let permissionObj = getPermissionObj();
//             let PermissionArray = result.Permission.split(',');
//             PermissionArray = PermissionArray.map(Number);
//
//             PermissionArray = PermissionArray.sort((a, b) => a - b);
//             PermissionArray.forEach((i) => {
//               permissionObj.forEach((j) => {
//                 if (j.ID >= parseInt(i, 10)) {
//                   if (j.ID === parseInt(i, 10)) {
//                     j.Status = true;
//                   } else {
//                     j.Status = false;
//                   }
//                 }
//               });
//             });
//             resolve(permissionObj);
//             permissionObj = JSON.stringify(permissionObj);
//             redisClient.set(`${clientID}${role}Permission`, `${permissionObj}`, (err, reply) => true);
//           });
//         // })
//       }
//     });
//   });
// }
// function getRoleMenu(clientID, role) {
//   return new Promise((resolve, reject) => {
//     redisClient.get(`${clientID}${role}Menu`, (err, replyMenu) => {
//       if (replyMenu) {
//         resolve(JSON.parse(replyMenu));
//       } else {
//         Role.findOne({ where: { PM_Client_ID: clientID, Description: role }, raw: true }).then((result) => {
//           const permissions = result.Permission.split(',');
//           let filterObj;
//           let filterArray = [];
//           Option.findAll({ where: { Status: 1 },
//             order: [
//               ['ID', 'ASC'],
//             ],
//             attributes: ['ID', 'Description', 'PermissionID', 'RouterLink', 'Icon'],
//             raw: true },
//           ).then((obj) => {
//             permissions.forEach((ID, index) => {
//               filterObj = obj.filter((e) => {
//                 if (e.PermissionID === 'All') {
//                   return true;
//                 }
//                 const p = e.PermissionID.split(',');
//                 return p.includes(ID);
//               });
//               filterObj.forEach((i) => {
//                 if (filterArray.includes(i) === false) filterArray.push(i);
//               });
//             });
//
//             filterArray = filterArray.sort((a, b) => a.ID - b.ID);
//             let manageProjectLocation = null;
//             for (let k = 0; k < filterArray.length; k++) {
//               if (filterArray[k].ID === 5) {
//                 filterArray[k].subMenu = [];
//                 const subMenuObj = {
//                   subMenuName: 'Manage Project',
//                   RouterLink: filterArray[k].RouterLink,
//                   Icon: filterArray[k].Icon,
//                 };
//                 filterArray[k].subMenu.push(subMenuObj);
//                 manageProjectLocation = k;
//               } else if (filterArray[k].ID === 6) {
//                 if (manageProjectLocation || manageProjectLocation === 0) {
//                   const subMenuObj = {
//                     subMenuName: 'Create Project',
//                     RouterLink: filterArray[k].RouterLink,
//                     Icon: filterArray[k].Icon,
//                   };
//                   filterArray[manageProjectLocation].subMenu[1] = subMenuObj;
//                   filterArray.splice(k, 1);
//                 } else {
//                   filterArray[k].subMenu = [];
//                   const subMenuObj = {
//                     subMenuName: 'Create Project',
//                     RouterLink: filterArray[k].RouterLink,
//                     Icon: filterArray[k].Icon,
//                   };
//                   filterArray[k].subMenu[0] = subMenuObj;
//                 }
//               } else if (filterArray[k].ID === 9) {
//                 filterArray[k].subMenu = [];
//                 const subMenuObj = {
//                   subMenuName: 'Company Profile',
//                   RouterLink: 'companyaccount',
//                   Icon: filterArray[k].Icon,
//                 };
//                 filterArray[k].subMenu[0] = subMenuObj;
//                 const subMenuObj1 = {
//                   subMenuName: 'My Profile',
//                   RouterLink: filterArray[k].RouterLink,
//                   Icon: filterArray[k].Icon,
//                 };
//                 filterArray[k].subMenu[1] = subMenuObj1;
//               }
//             }
//             resolve(filterArray);
//             filterArray = JSON.stringify(filterArray);
//             redisClient.set(`${clientID}${role}Menu`, `${filterArray}`, err => true);
//           });
//         }).catch((e) => {
//           reject(e);
//         });
//       }
//     });
//   });
// }
// function getRoleLogin(clientID, role) {
//   return new Promise((resolve, reject) => {
//     redisClient.get(`${clientID}${role}Login`, (err, replyLogin) => {
//       if (replyLogin) {
//         resolve(JSON.parse(replyLogin));
//       } else {
//         Role.findOne({ where: { PM_Client_ID: clientID, Description: role }, raw: true }).then((result) => {
//           let Obj = {};
//           Obj.IsWeb = result.IsWeb;
//           Obj.IsMobile = result.IsMobile;
//           resolve(Obj);
//           Obj = JSON.stringify(Obj);
//           redisClient.set(`${clientID}${role}Login`, Obj, (err, reply) => true);
//         });
//       }
//     });
//   });
// }
// function getMenuPermission(ClientID, role) {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const option = {};
//       // get permission
//       option.Permission = await getRolePermission(ClientID, role);
//       // get Menu
//       option.Menu = await getRoleMenu(ClientID, role);
//       // get login
//       option.LoginAccess = await getRoleLogin(ClientID, role);
//       resolve(option);
//     } catch (e) {
//       return reject(e);
//     }
//
//
//     // get permission
//   });
// }
// async function createUserRole(clientId, role) {
//   let roles = role.split(',');
//   roles = roles.map(key => parseInt(key, 10));
//   let roleString = '';
//   const roleList = await getRole(clientId);
//   roles.forEach((ID) => {
//     const filterObj = roleList.filter(e => ID === e.ID);
//     if (filterObj.length !== 0) {
//       roleString = `${roleString}${filterObj[0].Description},`;
//     }
//   });
//   roleString = roleString.slice(0, -1);
//   const option = await getMenuPermission(clientId, roleString.split(',')[0]);
//   return { Role: roleString.split(','), Permission: option.Permission, Menu: option.Menu, LoginAccess: option.LoginAccess, SelectedRole: roleString.split(',')[0] };
// }
function getRoleNew(clientID, userID) {
    return new Promise((resolve) => {
        UserRole.findAll({
            where: {
                clientID,
                userID,
                status: 1
            },
            raw: true,
            attributes: ['roleID']
        })
            .then((roleIDList) => {
                resolve(roleIDList);
            });
    });
}

function getRawData(clientID, userID, roleID) {
    return new Promise((resolve) => {
        UserRole.findAll({
            where: {
                clientID,
                userID,
                roleID,
                status: 1,
            },
            attributes: ['roleID'],
            include: [
                {
                    model: Role,
                    as: 'UserRole1',
                    where: {PM_Client_ID: clientID, Status: 1},
                    attributes: ['ID', 'Description', 'IsMobile', 'IsWeb'],
                    required: false,
                    include: [
                        {
                            model: RolePermission,
                            as: 'RoleP',
                            attributes: ['permissionID'],
                            where: {clientID, status: 1},
                            required: false,
                            include: [
                                {
                                    model: Permission,
                                    as: 'Permission2',
                                    attributes: ['Type'],
                                    where: {Status: 1},
                                    required: false,
                                    include: [{
                                        model: Menu,
                                        as: 'PermissionMenu',
                                        attributes: ['optionID'],
                                        where: {status: 1},
                                        required: false,
                                        include: [{
                                            model: Option,
                                            as: 'option1',
                                            attributes: ['ID', 'Description', 'RouterLink', 'Icon'],
                                            required: false,
                                        }],
                                    }],
                                },
                            ],
                        },
                    ],
                }],
            raw: true
        })
            .then((RoleID) => {
                resolve(RoleID);
            });
    });
}

function getPermissionData(RoleID) {
    return new Promise((resolve) => {
        let PermissionArray = [];
        const MenuArray = [];
        RoleID.forEach((item) => {
            const menuObj = {};
            const ID = item['UserRole1.RoleP.permissionID'];
            PermissionArray.push(ID);
            // menuObj.Description = item['UserRole1.RoleP.Permission2.PermissionMenu.option1.Description'];
            // menuObj.RouterLink = item['UserRole1.RoleP.Permission2.PermissionMenu.option1.RouterLink'];
            // menuObj.Icon = item['UserRole1.RoleP.Permission2.PermissionMenu.option1.Icon'];
            MenuArray.push(item['UserRole1.RoleP.Permission2.PermissionMenu.option1.ID']);
        });
        PermissionArray = [...new Set(PermissionArray)];
        PermissionArray = PermissionArray.sort((a, b) => a - b);
        Permission.findAll({
            where: {Status: 1},
            attributes: ['ID', 'Description', 'Type'],
            raw: true
        })
            .then((result) => {
                result.forEach((item) => {
                    item.Status = false;
                });
                PermissionArray.forEach((p) => {
                    result.forEach((item) => {
                        if(item.ID >= p) {
                            if(p === item.ID) {
                                item.Status = true;
                            } else {
                                item.Status = false;
                            }
                        }
                    });
                });
                const Obj = {};
                Obj.PermissionArray = result;
                Obj.MenuArray = MenuArray;
                resolve(Obj);
                // PermissionArray = result;
                // console.log(PermissionArray);
            });
    });
}

export function getMenuData(menuArry) {
    return new Promise((resolve) => {
        Option.findAll({
            where: {Status: 1},
            raw: true,
            attributes: ['ID', 'Description', 'PermissionID', 'RouterLink', 'Icon']
        })
            .then((menuList) => {
                let MenuData = [];
                let i = 0;
                menuArry.forEach((ID) => {
                    menuList.forEach((item) => {
                        if(item.ID === ID || item.PermissionID === 'All') {
                            MenuData[i] = item;
                            i++;
                        }
                    });
                });
                MenuData = [...new Set(MenuData)];
                MenuData = MenuData.sort((a, b) => a.ID - b.ID);
                let projectMenu = null;
                let accountMenu = null;
                MenuData.forEach((item, index) => {
                    if(item.ID === 5 || item.ID === 6) {
                        const subMenuObj = {};
                        if(item.Description === 'Create Project') {
                            subMenuObj.subMenuName = item.Description;
                        } else {
                            subMenuObj.subMenuName = 'Manage Project';
                        }

                        subMenuObj.RouterLink = item.RouterLink;
                        subMenuObj.Icon = item.Icon;
                        if(!projectMenu) {
                            projectMenu = index;
                            item.Description = 'Project Management';
                            item.RouterLink = 'manager';
                            item.Icon = 'projectMgmt.svg';
                            item.subMenu = [];
                            item.subMenu.push(subMenuObj);
                        } else {
                            MenuData[projectMenu].subMenu.push(subMenuObj);
                            item = null;
                            MenuData[index] = null;
                        }
                    } else if(item.ID === 9 || item.ID === 11) {
                        const subMenuObj = {};
                        subMenuObj.subMenuName = item.Description;
                        subMenuObj.RouterLink = item.RouterLink;
                        subMenuObj.Icon = item.Icon;
                        if(!accountMenu) {
                            accountMenu = index;
                            item.Description = 'Account';
                            item.RouterLink = 'myaccount';
                            item.Icon = 'myAcc.svg';
                            item.subMenu = [];
                            item.subMenu.push(subMenuObj);
                        } else {
                            MenuData[accountMenu].subMenu.push(subMenuObj);
                            MenuData[index] = null;
                        }
                    }
                });

                MenuData = MenuData.filter(item => item);
                resolve(MenuData);
            });
    });
}

function getRoleNameWeb(roleID, clientID) {
    return new Promise((resolve) => {
        const roleIDArr = [];
        roleID.forEach((item) => {
            roleIDArr.push(item.roleID);
        });
        Role.findAll({
            where: {ID: roleIDArr, PM_Client_ID: clientID, IsWeb: 1},
            raw: true,
            attributes: ['ID', 'Description']
        })
            .then((roleNameList) => {
                resolve(roleNameList);
            });
    });
}

function getRoleNameMobile(roleID, clientID) {
    return new Promise((resolve) => {
        const roleIDArr = [];
        roleID.forEach((item) => {
            roleIDArr.push(item.roleID);
        });
        Role.findAll({
            where: {ID: roleIDArr, PM_Client_ID: clientID, IsMobile: 1},
            raw: true,
            attributes: ['ID', 'Description']
        })
            .then((roleNameList) => {
                resolve(roleNameList);
            });
    });
}

function getRedisPermissionData(clientID, RoleName) {
    return new Promise((resolve) => {
        redisClient.get(`${clientID}newPermission${RoleName}`, (err, reply) => {
            if(err) {
                resolve(null);
            } else if(reply) {
                resolve(JSON.parse(reply));
            } else {
                resolve(null);
            }
        });
    });
}

function getRedisMenuData(clientID, RoleName) {
    return new Promise((resolve) => {
        redisClient.get(`${clientID}newMenu${RoleName}`, (err, reply) => {
            if(err) {
                resolve(null);
            } else if(reply) {
                resolve(JSON.parse(reply));
            } else {
                resolve(null);
            }
        });
    });
}

function getRedisAccessData(clientID, RoleName) {
    return new Promise((resolve) => {
        redisClient.get(`${clientID}newAccess${RoleName}`, (err, reply) => {
            if(err) {
                resolve(null);
            } else if(reply) {
                resolve(JSON.parse(reply));
            } else {
                resolve(null);
            }
        });
    });
}

function setRedisData(Object, clientID) {
    const LoginAccess = JSON.stringify(Object.LoginAccess);
    const PermissionString = JSON.stringify(Object.Permission);
    const MenuString = JSON.stringify(Object.Menu);
    redisClient.set(`${clientID}newAccess${Object.SelectedRole}`, LoginAccess, (err, reply) => {

    });
    redisClient.set(`${clientID}newPermission${Object.SelectedRole}`, PermissionString, (err, reply) => {

    });
    redisClient.set(`${clientID}newMenu${Object.SelectedRole}`, MenuString, (err, reply) => {

    });
}

function getPlanExpiry(clientID) {
    console.log('clientId',clientID)
    return new Promise((resolve) => {
        Order.findOne({
            where: {ORDER_CLIENT_ID: clientID},
            raw: true
        })
            .then((data) => {
                console.log('data',data)
                resolve(new Date() > new Date(data.ORDER_EXPIRY_DATE));
                // set plan expiry date
            });
    });
}

async function MenuPermissionCreation(clientID, userID, IsMobile) {
    // get selected role
    const returnObj = {};

    const planExpiry = await getPlanExpiry(clientID);
    if(!planExpiry) {
        const roleIDList = await getRoleNew(clientID, userID);
        // get role name list
        let roleNameList;
        if(!IsMobile) {
            roleNameList = await getRoleNameWeb(roleIDList, clientID);
        } else {
            roleNameList = await getRoleNameMobile(roleIDList, clientID);
        }
        if(roleNameList.length > 0) {
            const roleID = roleNameList[0].ID;
            returnObj.PM_User_Role = [];
            returnObj.selectRoleID = roleID;
            roleNameList.forEach((item) => {
                returnObj.PM_User_Role.push(item.Description);
            });
            returnObj.SelectedRole = roleNameList.find(item => item.ID === roleID);
            returnObj.SelectedRole = returnObj.SelectedRole.Description;
            returnObj.planExpiry = true;
            // get permission and Menu raw data
            // start redis
            const redisPermissionData = await getRedisPermissionData(clientID, returnObj.SelectedRole);
            const redisMenuData = await getRedisMenuData(clientID, returnObj.SelectedRole);
            const redisAccessData = await getRedisAccessData(clientID, returnObj.SelectedRole);
            if(!redisPermissionData || !redisMenuData || !redisAccessData) {
                const rawData = await getRawData(clientID, userID, roleID);
                // get permission
                const Obj = await getPermissionData(rawData);
                const PermisssionData = Obj.PermissionArray;
                // get Menu
                const MenuData = await getMenuData(Obj.MenuArray);
                // end redis
                const rawObj = rawData[0];
                returnObj.LoginAccess = {};
                returnObj.LoginAccess.IsMobile = rawObj['UserRole1.IsMobile'];
                returnObj.LoginAccess.IsWeb = rawObj['UserRole1.IsWeb'];
                returnObj.Permission = PermisssionData;
                returnObj.Menu = MenuData;
                setRedisData(returnObj, clientID);
            } else {
                returnObj.Permission = redisPermissionData;
                returnObj.Menu = redisMenuData;
                returnObj.LoginAccess = redisAccessData;
            }
            return returnObj;
        }
        const LoginAccess = {
            IsMobile: false,
            IsWeb: false,
        };
        returnObj.LoginAccess = LoginAccess;
        returnObj.planExpiry = true;
        return returnObj;
    }
    returnObj.planExpiry = false;
    return returnObj;
}

function getCode() {
    return crypto.randomBytes(64)
        .toString('hex');
}

export function index(req, res) {
    console.log("sss");
    const condition = {
        where: Sequelize.and(
            {PM_Domain: req.body.domain, PM_User_Active: 1},
            Sequelize.or(
                {
                    PM_User_MobileNumber: req.body.mobileNo,
                },
                {
                    PM_User_Email_ID: req.body.mobileNo,
                },
            ),
        ),
    };
    console.log('condition',RegisterUser);
    RegisterUser.findOne(condition)
        .then((userObj) => {
             console.log('amit user found',userObj)
            // project will be the first entry of the Projects table with the title 'aProject' || null
            if(userObj) {
                // const key1 = crypto.createDecipher(process.env.CRYPTO_ALGO, process.env.CRYPTO_SECKERT_KEY);// abc secret key
                // let password1 = key1.update(userObj.PM_User_Login_PWD, 'hex', 'utf8');
                // password1 += key1.final('utf8');
                //   console.log(password1);
                // console.log('afterLogin', userObj);
                const key = crypto.createCipher(process.env.CRYPTO_ALGO, 'abc');// abc replace by some data
                let password = key.update(req.body.password, 'utf8', 'hex');
                password += key.final('hex');
                if(userObj.PM_User_Login_PWD === password) {
                    console.log('amit user found',userObj.IsLock)
                    if(!userObj.IsLock) {
                        const user = {
                            PM_Client_ID: userObj.PM_Client_ID,
                            PM_User_MobileNumber: userObj.PM_User_MobileNumber,
                            PM_User_Email_ID: userObj.PM_User_Email_ID,
                            PM_User_DateofRegistration: userObj.PM_User_DateofRegistration,
                            PM_Domain: userObj.PM_Domain,
                            PM_UserID: userObj.PM_UserID,
                            PM_User_Role: userObj.PM_User_Role,
                            PM_Designation: userObj.PM_Designation,
                            PM_User_FullName: userObj.PM_User_FullName,
                            PM_Domain_ID: userObj.PM_Domain_ID,
                        };
                        if(req.body.isMobile) {
                            user.IMEI = req.body.deviceIMEI;
                        }
                        MenuPermissionCreation(user.PM_Client_ID, user.PM_UserID, req.body.isMobile)
                            .then((obj) => {
                                console.log('amit user 2',obj)
                                if(obj.planExpiry) {
                                    // login web or mobile permission
                                    let isLoginDeviceAccess = false;
                                    if(req.body.isMobile) {
                                        isLoginDeviceAccess = obj.LoginAccess.IsMobile;
                                    } else {
                                        isLoginDeviceAccess = obj.LoginAccess.IsWeb;
                                    }
                                    if(isLoginDeviceAccess) {
                                        user.PM_User_Role = obj.PM_User_Role;
                                        user.Permission = obj.Permission.filter(item => item.Status === true);
                                        redisClient.get(`${user.PM_User_MobileNumber}login${user.PM_Client_ID}`, (err, reply) => {
                                            if(reply) {
                                                logger.info({
                                                    msg: 'Already Login',
                                                    user: user.PM_User_MobileNumber,
                                                });
                                                return res.status(208)
                                                    .json({
                                                        success: false,
                                                        msg: 'Already login',
                                                        user,
                                                        password: req.body.password,
                                                    });
                                            } else if(userObj.PM_User_Status === true) {
                                                // console.log('role ', user.PM_User_Role);
                                                user.selectRoleID = obj.selectRoleID;
                                                let codeForDomain = null;
                                                if(req.body.urlDomain) {
                                                    codeForDomain = getCode();
                                                }
                                                user.Menu = obj.Menu;
                                                user.SelectedRole = obj.SelectedRole;
                                                jwt.sign({user}, process.env.JWT_SECKERT_KEY, (err, token) => {
                                                    if(err) {
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
                                                    if(req.body.urlDomain) {
                                                        redisClient.set(`${codeForDomain}account`, `${token}`, (err) => {
                                                            if(err) {
                                                                logger.error({
                                                                    msg: 'Entered credentials are invalid.',
                                                                    error: err,
                                                                });
                                                                return res.status(500)
                                                                    .json({
                                                                        success: false,
                                                                        msg: 'Entered credentials are invalid.',
                                                                    });
                                                            }
                                                        });
                                                    }
                                                    redisClient.set(`${user.PM_User_MobileNumber}login${user.PM_Client_ID}`, `${token}`, (err) => {
                                                        if(err) {
                                                            logger.error({
                                                                msg: 'Entered credentials are invalid.',
                                                                error: err,
                                                            });
                                                            return res.status(500)
                                                                .json({
                                                                    success: false,
                                                                    msg: 'Entered credentials are invalid.',
                                                                });
                                                        }
                                                        // redisClient.expire(`${user.PM_User_MobileNumber}`, process.env.IDEL_SESSION_TIME); // session time in sec
                                                        res.setHeader('Authorization', token);
                                                        redisClient.hdel(`user:${userObj.dataValues.PM_UserID}`, 'forgotpassword');
                                                        createSession(user.PM_UserID, user.PM_Client_ID, req.body.isMobile, req.body.deviceIMEI);
                                                        // console.log(userObj.PM_FirstLogin);
                                                        if(userObj.PM_FirstLogin === true) {
                                                            updateFirstLogin(user);
                                                            // welcome email notification
                                                            /* const bodyWelcome = {
                                                                          clientId: userObj.PM_Client_ID,
                                                                          senderId: userObj.PM_UserID,
                                                                          senderEmail: userObj.PM_User_Email_ID,
                                                                          senderMobile: userObj.PM_User_MobileNumber,
                                                                          messageType: 'welcomepms',
                                                                          subject: `Welcome to ETAPMS ${userObj.PM_User_FullName}`,
                                                                          priority: 'low',
                                                                          recipientsAndData: [
                                                                            { email: userObj.PM_User_Email_ID,
                                                                              // mob: userObj.PM_User_MobileNumber,
                                                                              data: `${userObj.PM_User_FullName}|${process.env.PROTOCOL}${userObj.PM_Domain.toLowerCase()}.${process.env.MAIN_DOMAIN}|`,
                                                                            },
                                                                          ],
                                                                        };
                                                                        console.log('bodyWelcome ---- 1 ---- ', bodyWelcome);
                                                                        saveEmailSmsBacked(bodyWelcome); */
                                                        }
                                                        delete user.Permission;
                                                        user.Menu = obj.Menu;
                                                        user.SelectedRole = obj.SelectedRole;
                                                        // user.PM_User_Role = obj.Role;
                                                        user.Permission = obj.Permission;
                                                        if(req.body.urlDomain) {
                                                            redisClient.set(`${codeForDomain}UserDetails`, JSON.stringify(user), (err) => {
                                                            });
                                                        }
                                                        return res.status(200)
                                                            .json({
                                                                success: true,
                                                                user,
                                                                codeForDomain,
                                                                PM_FirstLogin: userObj.PM_FirstLogin,
                                                            });
                                                    });
                                                });
                                            } else {
                                                return res.status(403)
                                                    .json({
                                                        success: false,
                                                        msg: 'Account is not Activated',
                                                        user,
                                                    });
                                            }
                                        });
                                    } else {
                                        if(req.isMobile) {
                                            return res.status(403)
                                                .json({
                                                    success: false,
                                                    msg: 'You don\'t have access to login on Mobile',
                                                });
                                        }
                                        return res.status(403)
                                            .json({
                                                success: false,
                                                msg: 'You don\'t have access to login on Web',
                                            });
                                    }
                                } else {
                                    return res.json({
                                        success: false,
                                        msg: 'Your plan has expired please renew your plan to reactivate',
                                    });
                                }
                            });


                        // checklogin is present
                    } else {
                        return res.json({
                            success: false,
                            msg: 'Account is Locked. Please Click Forgot Password',
                        });
                    }
                } else {
                    redisClient.hincrby(`user:${userObj.dataValues.PM_UserID}`, 'forgotpassword', 1);
                    redisClient.expire(`user:${userObj.dataValues.PM_UserID}`, process.env.FORGOT_PASSWORD_COUNT_TIME); // forgot password set time after that should expire
                    redisClient.hget(`user:${userObj.dataValues.PM_UserID}`, 'forgotpassword', (err, rep) => {
                        res.status(400)
                            .json({
                                success: false,
                                msg: 'Incorrect Password',
                                forgetPasswordAttempt: rep,
                            });
                        failedAttempts(userObj.dataValues.PM_UserID);
                        if(rep === '10') {
                            lockUser(userObj);
                        }
                    });

                    // res.send({ success: false, msg: 'Incorrect Password1' });
                }
            } else {
                res.status(401)
                    .json({success: false, msg: 'Entered Email ID and Mobile Number not registered.'});
            }
        });
}

export function getTokenByCode(req, res) {
    redisClient.get(`${req.query.code}account`, (err, reply) => {
        if(err) {
            res.send({Status: false, data: null});
        } else {
            redisClient.get(`${req.query.code}UserDetails`, (err1, reply1) => {
                if(err1) {
                    res.send({Status: false, data: null});
                } else {
                    const Obj = {};
                    Obj.user = JSON.parse(reply1);
                    res.send({Status: true, data: Obj, Token: reply});
                    redisClient.del(`${req.query.code}UserDetails`);
                    redisClient.del(`${req.query.code}account`);
                }
            });
        }
    });
}

export function getTokenByInfo(req, res) {
    redisClient.get(`${req.query.m}login${req.query.c}`, (err, reply) => {
        if(err || !reply) {
            res.send({Status: false, data: null});
        } else {
            res.send({Status: true, data: reply});
        }
    });
}

// module.exports = index
export function sendMobileOTP(req, res) {
    let mobielNo = '';
    let email = '';
    if(isNaN(req.body.mobileNo)) {
        email = req.body.mobileNo;
    } else {
        mobielNo = req.body.mobileNo;
    }

    const OTP = otpGenerator.generate(6, {
        upperCase: false,
        specialChars: false,
        digits: true,
        alphabets: false,
    });
    const smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    // mobile otp code
    const optSender = new SendOtp(process.env.AUTHKEY);
    const dateofOtp = moment(new Date())
        .format('YYYY-MM-DD HH:mm:ss');
    const condition = {
        where: Sequelize.and(
            {PM_Domain: req.body.domain, PM_User_Active: 1},
            Sequelize.or(
                {
                    PM_User_MobileNumber: req.body.mobileNo,
                },
                {
                    PM_User_Email_ID: req.body.mobileNo,
                },
            ),
        ),
    };
    RegisterUser.findOne(condition)
        .then((results) => {
            if(results) {
                RegisterUser.update({PM_User_OTP: OTP, PM_User_OTPTime: dateofOtp},
                    {where: {PM_User_MobileNumber: req.body.mobileNo, PM_Domain: req.body.domain}})
                    .then((updated) => {
                        if(updated[0] === 1) {
                            sendMsg([{recipients: `91${req.body.mobileNo}`, templateBody: `${OTP} is OTP for PMS,OTP is Valid for 10 min`}]);
                            return res.status(200)
                                .send({success: true, msg: 'Please check your mobile for OTP'});
                        }
                        return res.status(403)
                            .send({success: false, msg: 'Account not found'});
                    })
                    .catch((err) => {
                        res.status(500)
                            .json({
                                success: false,
                                msg: 'Unauthorised Accesss',
                            });
                    });
            } else {
                return res.status(403)
                    .send({success: false, msg: 'Account not found'});
            }
        })
        .catch((err) => {
            res.status(500)
                .json({
                    success: false,
                    msg: 'Unauthorised Accesss',
                });
        });
}

function getDomain(tempResult, OTP, dateofOtp) {
    const promises = tempResult.map(user => new Promise((resolve, reject) => {
            MenuPermissionCreation(user.PM_Client_ID, user.PM_UserID, true)
                .then((obj) => {
                    if(obj.planExpiry) {
                        // login web or mobile permission
                        if(obj.LoginAccess.IsMobile) {
                            RegisterClient.findOne({where: {PM_Client_Domain: user.PM_Domain}})
                                .then((obj) => {
                                    if(obj) {
                                        // RegisterUser.update({ PM_User_OTP: OTP, PM_User_OTPTime: dateofOtp },
                                        //   { where: { PM_User_MobileNumber: user.PM_User_MobileNumber, PM_User_Email_ID: user.PM_User_Email_ID, PM_Domain: user.PM_Domain } }).then(() => {
                                        //   resolve({ company: obj.PM_Client_Name, domain: user.PM_Domain });
                                        // });
                                        resolve({company: obj.PM_Client_Name, domain: user.PM_Domain});
                                    } else {
                                        resolve();
                                    }
                                });
                        } else {
                            resolve();
                        }
                    } else {
                        resolve();
                    }
                });
        },
    ));
    return promises;
}

export function getAllDomains(data, OTP, dateofOtp) {
    const tempResult = data;
    return Promise.all(getDomain(tempResult, OTP, dateofOtp));
}

export function sendDomains(req, res) {
    let mobielNo = '';
    let email = '';
    if(isNaN(req.body.mobileNo)) {
        email = req.body.mobileNo;
    } else {
        mobielNo = req.body.mobileNo;
    }
    const condition = {
        where: Sequelize.or(
            {
                PM_User_MobileNumber: mobielNo,
            },
            {
                PM_User_Email_ID: email,
            },
        ),
    };
    RegisterUser.findAll(condition)
        .then((results) => {
            if(results.length > 0) {
                getAllDomains(results, null, null)
                    .then((domains) => {
                        domains = domains.filter(domain => domain);
                        return res.status(200)
                            .send({success: true, msg: domains});
                    });
            } else {
                return res.status(404)
                    .send({success: false, msg: 'Account not found'});
            }
        });
}

export function mobileLogin(req, res) {
    const condition = {
        where: Sequelize.and(
            {PM_Domain: req.body.domain, PM_User_Active: 1, PM_User_OTP: req.body.OTP},
            Sequelize.or(
                {
                    PM_User_MobileNumber: req.body.mobileNo,
                },
                {
                    PM_User_Email_ID: req.body.mobileNo,
                },
            ),
        ),
    };
    RegisterUser.findOne(condition)
        .then((userObj) => {
            // project will be the first entry of the Projects table with the title 'aProject' || null
            if(userObj) {
                const timeDiff = (new Date().getTime() -
                    new Date(userObj.PM_User_OTPTime).getTime()) / 1000;
                if(timeDiff <= process.env.OTP_TIME) {
                    if(!userObj.IsLock) {
                        const user = {
                            PM_Client_ID: userObj.PM_Client_ID,
                            PM_User_MobileNumber: userObj.PM_User_MobileNumber,
                            PM_User_Email_ID: userObj.PM_User_Email_ID,
                            PM_User_DateofRegistration: userObj.PM_User_DateofRegistration,
                            PM_Domain: userObj.PM_Domain,
                            PM_UserID: userObj.PM_UserID,
                            PM_User_Role: userObj.PM_User_Role,
                            PM_Designation: userObj.PM_Designation,
                            PM_User_FullName: userObj.PM_User_FullName,
                            PM_Domain_ID: userObj.PM_Domain_ID,
                        };
                        if(req.body.isMobile) {
                            user.IMEI = req.body.deviceIMEI;
                        }
                        MenuPermissionCreation(user.PM_Client_ID, user.PM_UserID, req.body.isMobile)
                            .then((obj) => {
                                if(obj.planExpiry) {
                                    // login web or mobile permission
                                    let isLoginDeviceAccess = false;
                                    if(req.body.isMobile) {
                                        isLoginDeviceAccess = obj.LoginAccess.IsMobile;
                                    } else {
                                        isLoginDeviceAccess = obj.LoginAccess.IsWeb;
                                    }
                                    if(isLoginDeviceAccess) {
                                        user.PM_User_Role = obj.PM_User_Role;
                                        user.Permission = obj.Permission.filter(item => item.Status === true);
                                        redisClient.get(`${user.PM_User_MobileNumber}login${user.PM_Client_ID}`, (err, reply) => {
                                            if(reply) {
                                                logger.info({
                                                    msg: 'Already Login',
                                                    user: user.PM_User_MobileNumber,
                                                });
                                                return res.status(208)
                                                    .json({
                                                        success: false,
                                                        msg: 'Already login',
                                                        user,
                                                    });
                                                // RegisterUser.update({ PM_User_OTP: null, PM_User_OTPTime: null },
                                                //   { where: { PM_User_MobileNumber: req.body.mobileNo, PM_Domain: req.body.domain } }).then(updated => res.status(208)
                                                //   .json({
                                                //     success: false,
                                                //     msg: 'Already login',
                                                //     user,
                                                //     password: req.body.password,
                                                //   }));
                                            } else if(userObj.PM_User_Status === true) {
                                                // console.log('role ', user.PM_User_Role);
                                                user.selectRoleID = obj.selectRoleID;
                                                let codeForDomain = null;
                                                if(req.body.urlDomain) {
                                                    codeForDomain = getCode();
                                                }
                                                user.Menu = obj.Menu;
                                                user.SelectedRole = obj.SelectedRole;
                                                jwt.sign({user}, process.env.JWT_SECKERT_KEY, (err, token) => {
                                                    if(err) {
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
                                                    if(req.body.urlDomain) {
                                                        redisClient.set(`${codeForDomain}account`, `${token}`, (err) => {
                                                            if(err) {
                                                                logger.error({
                                                                    msg: 'Entered credentials are invalid.',
                                                                    error: err,
                                                                });
                                                                return res.status(500)
                                                                    .json({
                                                                        success: false,
                                                                        msg: 'Entered credentials are invalid.',
                                                                    });
                                                            }
                                                        });
                                                    }
                                                    redisClient.set(`${user.PM_User_MobileNumber}login${user.PM_Client_ID}`, `${token}`, (err) => {
                                                        if(err) {
                                                            logger.error({
                                                                msg: 'Entered credentials are invalid.',
                                                                error: err,
                                                            });
                                                            return res.status(500)
                                                                .json({
                                                                    success: false,
                                                                    msg: 'Entered credentials are invalid.',
                                                                });
                                                        }
                                                        // redisClient.expire(`${user.PM_User_MobileNumber}`, process.env.IDEL_SESSION_TIME); // session time in sec
                                                        res.setHeader('Authorization', token);
                                                        redisClient.hdel(`user:${userObj.dataValues.PM_UserID}`, 'forgotpassword');
                                                        createSession(user.PM_UserID, user.PM_Client_ID, req.body.isMobile, req.body.deviceIMEI);
                                                        // console.log(userObj.PM_FirstLogin);
                                                        if(userObj.PM_FirstLogin === true) {
                                                            updateFirstLogin(user);
                                                            // welcome email notification
                                                            /* const bodyWelcome = {
                                                                                                                              clientId: userObj.PM_Client_ID,
                                                                                                                              senderId: userObj.PM_UserID,
                                                                                                                              senderEmail: userObj.PM_User_Email_ID,
                                                                                                                              senderMobile: userObj.PM_User_MobileNumber,
                                                                                                                              messageType: 'welcomepms',
                                                                                                                              subject: `Welcome to ETAPMS ${userObj.PM_User_FullName}`,
                                                                                                                              priority: 'low',
                                                                                                                              recipientsAndData: [
                                                                                                                                { email: userObj.PM_User_Email_ID,
                                                                                                                                  // mob: userObj.PM_User_MobileNumber,
                                                                                                                                  data: `${userObj.PM_User_FullName}|${process.env.PROTOCOL}${userObj.PM_Domain.toLowerCase()}.${process.env.MAIN_DOMAIN}|`,
                                                                                                                                },
                                                                                                                              ],
                                                                                                                            };
                                                                                                                            console.log('bodyWelcome ---- 1 ---- ', bodyWelcome);
                                                                                                                            saveEmailSmsBacked(bodyWelcome); */
                                                        }
                                                        delete user.Permission;
                                                        user.Menu = obj.Menu;
                                                        user.SelectedRole = obj.SelectedRole;
                                                        // user.PM_User_Role = obj.Role;
                                                        user.Permission = obj.Permission;
                                                        if(req.body.urlDomain) {
                                                            redisClient.set(`${codeForDomain}UserDetails`, JSON.stringify(user), (err) => {
                                                            });
                                                        }
                                                        RegisterUser.update({PM_User_OTP: null, PM_User_OTPTime: null},
                                                            {where: {PM_User_MobileNumber: req.body.mobileNo, PM_Domain: req.body.domain}})
                                                            .then(updated => res.status(200)
                                                                .json({
                                                                    success: true,
                                                                    user,
                                                                    codeForDomain,
                                                                    PM_FirstLogin: userObj.PM_FirstLogin,
                                                                }));
                                                    });
                                                });
                                            } else {
                                                return res.status(403)
                                                    .json({
                                                        success: false,
                                                        msg: 'Account is not Activated',
                                                        user,
                                                    });
                                            }
                                        });
                                    } else {
                                        if(req.isMobile) {
                                            return res.status(403)
                                                .json({
                                                    success: false,
                                                    msg: 'You don\'t have access to login on Mobile',
                                                });
                                        }
                                        return res.status(403)
                                            .json({
                                                success: false,
                                                msg: 'You don\'t have access to login on Web',
                                            });
                                    }
                                } else {
                                    return res.json({
                                        success: false,
                                        msg: 'Your plan has expired please renew your plan to reactivate',
                                    });
                                }
                            });


                        // checklogin is present
                    } else {
                        return res.json({
                            success: false,
                            msg: 'Account is Locked. Please Click resend OTP',
                        });
                    }
                } else {
                    // redisClient.hincrby(`user:${userObj.dataValues.PM_UserID}`, 'forgotpassword', 1);
                    // redisClient.expire(`user:${userObj.dataValues.PM_UserID}`, process.env.FORGOT_PASSWORD_COUNT_TIME); // forgot password set time after that should expire
                    // redisClient.hget(`user:${userObj.dataValues.PM_UserID}`, 'forgotpassword', (err, rep) => {
                    //   res.status(400).json({
                    //     success: false,
                    //     msg: 'Incorrect Password',
                    //     forgetPasswordAttempt: rep,
                    //   });
                    //   failedAttempts(userObj.dataValues.PM_UserID);
                    //   if (rep === '10') {
                    //     lockUser(userObj);
                    //   }
                    // });
                    return res.status(408)
                        .send({
                            success: false,
                            msg: 'OTP entered is expired. Please click RESEND OTP in order to receive new OTP',
                        });

                    // res.send({ success: false, msg: 'Incorrect Password1' });
                }
            } else {
                res.status(401)
                    .json({success: false, msg: 'Entered OTP is not valid.'});
            }
        });
}
