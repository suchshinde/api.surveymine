/* eslint-disable import/prefer-default-export,prefer-rest-params,guard-for-in,no-param-reassign,no-restricted-syntax,max-len,no-unused-vars,consistent-return,no-useless-escape,no-plusplus */
import nodemailer from 'nodemailer';
import fs from 'fs';
import _ from 'lodash';
import {
    RegisterUser,
    Sequelize,
    Role,
    //userResource,
    // / NotificationsScreen,
    UserRole,
    //  Project,
    // SubProject,
    //  Milestone,
    //  Task,
    //   Audit,
    //   Approve,
    LoginSession,
    RolePermission,
    resourceRole,
} from '../../sqldb';
import {RegisterClient, Subscription} from '../../sqldb/portal.db';
import { saveEmailSmsBacked, saveScreenBackend, createBodyAndSendNotification } from '../notifications/notifications.controller';
//import { showDetailsProject } from '../project/project.controller';
//import { getImageUrl, saveImageBackEnd, getSingleImage } from '../imageManagement/imageManagement.controller';


function extend(target) {
    const sources = [].slice.call(arguments, 1);
    sources.forEach((source) => {
        for(const prop in source) {
            target[prop] = source[prop];
        }
    });
    return target;
}

function sendEmail(email, mobileNo, domain) {
    const smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
    const mailOptions = {
        to: email,
        subject: 'Account created',
        html: `Hello,<br> your account is created for ${domain}. setup your account by setting password. Use following link <br>
<a href='http://localhost:4200/'>setup account</a>`,
    };
    smtpTransport.sendMail(mailOptions, (error) => {
        if(error) {
            console.error({
                msg: 'otp sending error',
                error,
            });
        } else {
            smtpTransport.close();
        }
    });
}

function decodeBase64Image(dataString) {
    return new Promise((resolve) => {
        const matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        const response = {};

        if(matches.length !== 3) {
            return new Error('Invalid input string');
        }

        response.type = matches[1];
        response.data = new Buffer(matches[2], 'base64');

        resolve(response);
    });
}

function encodeBase64Image(filePath) {
    return new Promise((resolve) => {
        if(fs.existsSync(filePath)) {
            fs.readFile(filePath, (err, data) => {
                if(err) resolve(null);
                const buff = new Buffer(data);
                let imageData = buff.toString('base64');
                imageData = `data:image/${filePath.split('.')
                    .pop()};base64,${imageData}`;
                resolve(imageData);
            });
        } else {
            resolve(null);
        }
    });
}

async function getAllUser(data) {
    for(const item of data) {
        if(item.PM_User_ProfilePic) {
            const userUploadedFeedMessagesLocation = `${process.env.UPLOAD_PATH}/pmsuploads/images/profile/`;
            const userUploadedImagePath = `${userUploadedFeedMessagesLocation}${item.PM_User_ProfilePic}`;
            item.PM_User_ProfilePic = await encodeBase64Image(userUploadedImagePath);
        }
    }
    return data;
}

function createFile(filePath, imageData, dir) {
    return new Promise((resolve) => {
        if(!fs.existsSync(dir)) {
            fs.mkdirSync(`${process.env.UPLOAD_PATH}/pmsuploads/`);
            fs.mkdirSync(`${process.env.UPLOAD_PATH}/pmsuploads/images/`);
            fs.mkdirSync(dir);
        }
        fs.writeFile(filePath, imageData,
            (err) => {
                if(err) {
                    return resolve(null);
                }
                return resolve(filePath);
            });
    });
}

function getUserCount(Client) {
    return new Promise((resolve) => {
        RegisterUser.count({where: {PM_Client_ID: Client, PM_User_Active: 1}, raw: true})
            .then((count) => {
                resolve(count);
            });
    });
}

export function getMaxUserAllow(Client) {
    return new Promise((resolve) => {
        RegisterClient.findOne({
            where: {PM_Client_ID: Client},
            raw: true,
            attributes: ['PM_Plan_Id']
        })
            .then((planID) => {
                if(planID) {
                    Subscription.findOne({
                        where:
                            {PLAN_ID: planID.PM_Plan_Id},
                        raw: true,
                        attributes: ['PLAN_USERS', 'PLAN_ROLES', 'PLAN_PROJECT'],
                    })
                        .then((planUser) => {
                            resolve(planUser);
                        });
                } else {
                    const planUser = {};
                    planUser.PLAN_USERS = 2;
                    planUser.PLAN_ROLES = 2;
                    planUser.PLAN_PROJECT = 2;
                    resolve(planUser);
                }
            });
    });
}

async function insertInto(User, from) {
    // get plan details for creating user here
    const Obj = {};
    if(from === 'new') {
        const userCount = await getUserCount(User.PM_Client_ID);
        const maxUserAllow = await getMaxUserAllow(User.PM_Client_ID);

        Obj.filePath = null;
        Obj.userCount = userCount;
        Obj.maxUserAllow = maxUserAllow.PLAN_USERS;
    }


    /* if (User.PM_User_ProfilePic) {
      const imageTypeRegularExpression = /\/(.*?)$/;
      const imageBuffer = await decodeBase64Image(User.PM_User_ProfilePic);
      const userUploadedFeedMessagesLocation = `${process.env.UPLOAD_PATH}/pmsuploads/images/profile/`;
      const uniqueRandomImageName = `image-${User.PM_User_MobileNumber}`;
      const imageTypeDetected = imageBuffer.type.match(imageTypeRegularExpression);
      const userUploadedImagePath = `${userUploadedFeedMessagesLocation}${uniqueRandomImageName}.${imageTypeDetected[1]}`;
      // const userUploadedImagePath = `${uniqueRandomImageName}.${imageTypeDetected[1]}`;
      const filePath = await createFile(userUploadedImagePath, imageBuffer.data, userUploadedFeedMessagesLocation);
      Obj.filePath = filePath;
      if (from === 'new') {
        return Obj;
      }
      return filePath;
    } */
    if(from === 'new') {
        return Obj;
    }
    return null;
}

export function getAllUserNoti(req) {
    const query = {
        where: {
            PM_UserID: {[Sequelize.Op.ne]: req.authData.PM_UserID},
            PM_Client_ID: req.authData.PM_Client_ID,
            PM_User_Active: 1,
            PM_User_Status: 1,
        },
        order: [
            ['PM_UserID', 'DESC'],
        ],
        attributes: [
            'PM_UserID',
            'PM_User_FullName',
            'PM_Designation',
            'PM_User_ProfilePic',
        ],
        raw: true,
    };

    return new Promise((resolve, reject) => RegisterUser.findAll(query)
        .then((results) => {
            getAllUser(results)
                .then((data) => {
                    resolve(data);
                });
        })
        .catch((err) => {
            reject(err);
        }));
}

export function show(req, res) {
    let likeCause = '';
    let limitValue;
    let skip;
    if(req.query.q) {
        likeCause = req.query.q;
    }
    const query = {
        where: {
            PM_Client_ID: req.authData.PM_Client_ID,
            PM_User_Active: 1,
            PM_User_FullName: {[Sequelize.Op.like]: `%${likeCause}%`}
        },
        order: [
            ['PM_UserID', 'DESC'],
        ],
        attributes: ['PM_UserID', 'PM_User_Email_ID', 'PM_User_MobileNumber', 'PM_User_Role', 'PM_User_Active',
            'PM_User_Department', 'PM_User_FullName', 'PM_User_Address', 'PM_User_State', 'PM_User_District',
            'PM_User_Village', 'PM_User_Pincode', 'PM_Designation', 'PM_User_ProfilePic'],
        raw: true,
    };
    if(req.query.limit && req.query.limit !== '' && req.query.skip && req.query.skip !== '') {
        limitValue = parseInt(req.query.limit, 10);
        skip = parseInt(req.query.skip, 10);
        skip *= limitValue;
        query.offset = skip;
        query.limit = limitValue;
    }
    RegisterUser.findAll(query)
        .then((data) => {
            if(data) {
                /* getAllUser(results)
                  .then((data) => { */
                data.forEach((item) => {
                    if(item.PM_User_Role) {
                        item.PM_User_Role = item.PM_User_Role.split(',');
                        item.PM_User_Role = item.PM_User_Role.map(key => parseInt(key, 10),
                        );
                    }
                });
                data.forEach((user) => {
                    if(user.PM_UserID === req.authData.PM_UserID) {
                        user.isCurrentUser = true;
                    } else {
                        user.isCurrentUser = false;
                    }
                });

                if(data && data.length > 0) {
                    //console.log('data', data);
                    res.send(data);
                    // getImageUrl(res, data, 0, 'User_PP');
                } else {
                    res.send(data);
                }
                // });
            }
        });
}

export function getCustomer(req, res) {
    // req.authData.PM_Client_ID
    Role.findAll({
        where: {PM_Client_ID: req.authData.PM_Client_ID, Description: 'Customer', Status: 1},
        raw: true,
        include: [{
            model: UserRole,
            as: 'Role',
            where: {
                clientID: req.authData.PM_Client_ID,
                status: 1,
            },
            required: false,
            attributes: ['ID', 'roleID'],
            include: [
                {
                    model: RegisterUser,
                    as: 'UserRole2',
                    where: {
                        PM_Client_ID: req.authData.PM_Client_ID,
                        PM_User_Status: 1,
                    },
                    required: false,
                    attributes: ['PM_UserID', 'PM_User_FullName'],

                },
            ],
        }],
    })
        .then((userList) => {
            const userArr = [];
            userList.forEach((item) => {
                const obj = {};
                obj.PM_UserID = item['Role.UserRole2.PM_UserID'];
                obj.Name = item['Role.UserRole2.PM_User_FullName'];
                if(obj.PM_UserID) {
                    userArr.push(obj);
                }
            });
            res.send(userArr);
        });
}

export function getUser(req, res) {
    const UserID = req.params.id;
    RegisterUser.findOne({
        where: {PM_UserID: UserID, PM_Client_ID: req.authData.PM_Client_ID},
        attributes: ['PM_UserID', 'PM_User_Email_ID', 'PM_User_MobileNumber', 'PM_User_Role',
            'PM_User_Department', 'PM_User_FullName', 'PM_User_Address', 'PM_User_State', 'PM_User_District',
            'PM_User_Village', 'PM_User_Pincode', 'PM_Designation', 'PM_User_ProfilePic'],
        // raw: true,
        include: [{
            model: UserRole,
            as: 'User',
            where: {clientID: req.authData.PM_Client_ID, status: 1},
            attributes: ['roleID'],
            required: false,
            include: [{
                model: Role,
                as: 'UserRole1',
                where: {PM_Client_ID: req.authData.PM_Client_ID, Status: 1},
                attributes: ['ID', 'Description'],
                required: false,
            }],
        }]
    })
        .then((result) => {
            if(result) {
                let data = [];
                data[0] = result;
                /* const results = [];
                results[0] = result;
                 getAllUser(results)
                  .then((data) => { */
                const userList = [];
                data.forEach((item) => {
                    const newUser = {};
                    const newRole = {};
                    // if (userList.length > 0) {
                    const index = userList.findIndex(u => u.PM_UserID === item.PM_UserID);
                    if(index >= 0) { // user is already in userList just push role of that user in Role
                        // newRole.ID = item['User.roleID'];
                        // newRole.Description = item['User.UserRole1.Description'];
                        // userList[index].PM_User_Role.push(newRole);
                        item.User.forEach((roles) => {
                            userList[index].PM_User_Role.push(roles.UserRole1);
                        });
                        // userList[index].role.push(newRole);
                    } else {
                        newUser.PM_UserID = item.PM_UserID;
                        newUser.PM_User_Email_ID = item.PM_User_Email_ID;
                        newUser.PM_User_MobileNumber = item.PM_User_MobileNumber;
                        newUser.PM_User_Department = item.PM_User_Department;
                        newUser.PM_User_FullName = item.PM_User_FullName;
                        newUser.PM_Designation = item.PM_Designation;
                        newUser.PM_User_ProfilePic = item.PM_User_ProfilePic;
                        newUser.PM_User_Role = [];
                        newUser.PM_User_Address = item.PM_User_Address;
                        // newUser.role = [];
                        // newRole.ID = item['User.roleID'];
                        // newRole.Description = item['User.UserRole1.Description'];
                        // newUser.PM_User_Role.push(newRole);
                        // newUser.role.push(newRole);
                        item.User.forEach((roles) => {
                            newUser.PM_User_Role.push(roles.UserRole1.dataValues);
                        });
                        userList.push(newUser);
                    }
                    // }
                });

                userList.forEach((item) => {
                    item.PM_User_Role = item.PM_User_Role.map(map => map.ID);
                    item.PM_User_Role = item.PM_User_Role.toString();
                });
                data = userList;
                if(data && data.length > 0) {
                    return getSingleImage(data[0], 'login')
                        .then(data1 => res.send(data1))
                        .catch(data1 => res.send(data1));
                }
                return res.send(data[0]);
                // });
            }
        });
}

export function getUserBackEnd(id) {
    const UserID = id;
    return new Promise((resolve) => {
        RegisterUser.findOne({
            where: {PM_UserID: UserID},
            attributes: ['PM_UserID', 'PM_User_Email_ID', 'PM_User_MobileNumber', 'PM_User_Role',
                'PM_User_Department', 'PM_User_FullName', 'PM_User_Address', 'PM_User_State', 'PM_User_District',
                'PM_User_Village', 'PM_User_Pincode', 'PM_Designation', 'PM_User_ProfilePic']
        })
            .then((result) => {
                resolve(result);
            })
            .catch(() => resolve(null));
    });
}

export function update(req, res) {
    const bodyForImage = {
        PM_Client_ID: req.authData.PM_Client_ID,
        PM_UserID: req.body.PM_UserID,
        imageData: req.body.PM_User_ProfilePic,
        whichImage: 'User_PP',
    };
    insertInto(req.body, 'update')
        .then((filePath) => {
            /* if (filePath) {
              req.body.PM_User_ProfilePic = `image-${req.body.PM_User_MobileNumber}.${filePath.split('.')
                .pop()}`;
            } else {
              req.body.PM_User_ProfilePic = filePath;
            } */
            delete req.body.PM_User_ProfilePic;
            RegisterUser.update(req.body,
                {where: {PM_UserID: req.body.PM_UserID}})
                .then((results) => {
                    if(results[0] === 1) {
                        UserRole.update({status: 0}, {
                            where: {
                                userID: req.body.PM_UserID,
                                clientID:
                                req.authData.PM_Client_ID
                            }
                        })
                            .then((result11) => {
                                const roleList = req.body.PM_User_Role.split(',');
                                roleList.forEach((roleID, index1) => {
                                    const userRoleObj = {};
                                    userRoleObj.clientID = req.authData.PM_Client_ID;
                                    userRoleObj.userID = req.body.PM_UserID;
                                    userRoleObj.roleID = roleID;
                                    userRoleObj.status = 1;
                                    UserRole.create(userRoleObj)
                                        .then((s) => {
                                            if(index1 === roleList.length - 1) {
                                                if(bodyForImage.imageData) {
                                                    return saveImageBackEnd(bodyForImage)
                                                        .then(() => res.status(200)
                                                            .json({success: true, msg: 'User Updated Successfully'}))
                                                        .catch(() => res.status(200)
                                                            .json({success: true, msg: 'User Updated Successfully'}));
                                                }
                                                return res.status(200)
                                                    .json({success: true, msg: 'User Updated Successfully'});
                                            }
                                        });
                                });
                            });
                    }
                })
                .catch((err) => {
                    res.status(409)
                        .json({success: false, msg: err.errors[0].message});
                });
        })
        .catch((err) => {

        });
}

export function role(req, res) {
    //req.authData={};
    //req.authData.PM_Client_ID="1";
    Role.findAll({
            where: {Status: 1, PM_Client_ID: req.authData.PM_Client_ID},
            order: [
                ['ID', 'DESC'],
            ],
            attributes: ['ID', 'Description'],
            raw: true
        },
    )
        .then((obj) => {
            res.json(obj);
        })
        .catch(() => {
            res.status(500)
                .send({success: false, msg: 'Something Went Wrong'});
        });
}

export function getResources(req, res) {
    let likeCause = '';
    let limitValue;
    let skip;
    if(req.query.q) {
        likeCause = req.query.q;
    }
    const query = {
        where: {
            PM_Client_ID: req.authData.PM_Client_ID,
            PM_User_Active: 1,
            PM_User_FullName: {[Sequelize.Op.like]: `%${likeCause}%`}
        },
        order: [
            ['PM_UserID', 'DESC'],
        ],
        attributes: ['PM_UserID', 'PM_User_Email_ID', 'PM_User_MobileNumber', 'PM_User_Role',
            'PM_User_Department', 'PM_User_FullName', 'PM_User_Address', 'PM_User_State', 'PM_User_District',
            'PM_User_Village', 'PM_User_Pincode', 'PM_Designation', 'PM_User_ProfilePic'],
        raw: true,
        include: [{
            model: UserRole,
            as: 'User',
            where: {clientID: req.authData.PM_Client_ID, status: 1},
            attributes: ['roleID'],
            required: false,
            include: [{
                model: Role,
                as: 'UserRole1',
                where: {PM_Client_ID: req.authData.PM_Client_ID, Status: 1},
                attributes: ['ID', 'Description'],
                required: false,
            }],
        }],
    };
    if(req.query.limit && req.query.limit !== '' && req.query.skip && req.query.skip !== '') {
        limitValue = parseInt(req.query.limit, 10);
        skip = parseInt(req.query.skip, 10);
        skip *= limitValue;
        query.offset = skip;
        query.limit = limitValue;
    }
    RegisterUser.findAll(query)
        .then((data) => {
            /* getAllUser(results).then((data) => { */
            const userList = [];
            data.forEach((item) => {
                const newUser = {};
                const newRole = {};
                // if (userList.length > 0) {
                const index = userList.findIndex(u => u.PM_UserID === item.PM_UserID);
                if(index >= 0) { // user is already in userList just push role of that user in Role
                    newRole.ID = item['User.roleID'];
                    newRole.Description = item['User.UserRole1.Description'];
                    userList[index].PM_User_Role.push(newRole);
                    // userList[index].role.push(newRole);
                } else {
                    newUser.PM_UserID = item.PM_UserID;
                    newUser.PM_User_Email_ID = item.PM_User_Email_ID;
                    newUser.PM_User_MobileNumber = item.PM_User_MobileNumber;
                    newUser.PM_User_Department = item.PM_User_Department;
                    newUser.PM_User_FullName = item.PM_User_FullName;
                    newUser.PM_Designation = item.PM_Designation;
                    newUser.PM_User_ProfilePic = item.PM_User_ProfilePic;
                    newUser.PM_User_Role = [];
                    // newUser.role = [];
                    newRole.ID = item['User.roleID'];
                    newRole.Description = item['User.UserRole1.Description'];
                    newUser.PM_User_Role.push(newRole);
                    // newUser.role.push(newRole);
                    userList.push(newUser);
                }
                // }
            });
            userList.forEach((item) => {
                item.PM_User_Role = item.PM_User_Role.map(map => map.ID);
                item.PM_User_Role = item.PM_User_Role.toString();
            });
            data = userList;
            // res.send({ status: 200, message: { success: true, data: userList } });
            Role.findAll({
                where: {PM_Client_ID: req.authData.PM_Client_ID},
                order: [
                    ['ID', 'DESC'],
                ],
                attributes: ['ID', 'Description'],
                raw: true,
            })
                .then((roles) => {
                    // res.send(data);
                    userResource.findAll({
                        where: {resource_client_id: Number(req.authData.PM_Client_ID), resource_project_id: Number(req.params.projectId), resource_status: 1},
                        order: [
                            ['resource_project_id', 'DESC'],
                        ],
                        attributes: ['resource_id', 'resource_client_id', 'resource_project_id', 'resource_user_id', 'resource_user_role', 'resource_status'],
                        raw: true,
                    })
                        .then((userResources) => {
                            data.forEach((user) => {
                                user.updateResource = false;
                                if(user.PM_User_Role) {
                                    user.PM_User_Role = user.PM_User_Role.split(',');
                                    user.PM_User_Role = user.PM_User_Role.map(key => parseInt(key, 10),
                                    );
                                    user.role = [];
                                    user.PM_User_Role = user.PM_User_Role.map((roleId, index) => {
                                        const userRole = roles.filter(usrRole => roleId === usrRole.ID);
                                        if(userRole) {
                                            user.role[index] = {};
                                            user.role[index] = userRole[0];
                                        }
                                        return userRole[0];
                                    });
                                }

                                userResources.forEach((userRes) => {
                                    if(parseInt(userRes.resource_user_id, 10) === parseInt(user.PM_UserID, 10)) {
                                        user.role = [];
                                        user.updateResource = true;
                                        user.resource_id = userRes.resource_id;
                                        if(userRes.resource_user_role) {
                                            userRes.resource_user_role = userRes.resource_user_role.split(',');
                                            userRes.resource_user_role = userRes.resource_user_role.map(key => parseInt(key, 10),
                                            );
                                            userRes.resource_user_role.forEach((roleId, index) => {
                                                const userRole = roles.filter(usrRole => roleId === usrRole.ID);
                                                if(userRole) {
                                                    user.role[index] = {};
                                                    user.role[index] = userRole[0];
                                                }
                                            });
                                        }
                                    }
                                });
                            });
                            if(data.length > 0) {
                                // res.send({ status: 200, message: { success: true, data } });
                                getImageUrl(res, data, 0, 'User_PP_Resource');
                            } else {
                                res.send({status: 200, message: {success: false, data: 'No user found'}});
                            }
                        });
                });
            /* }).catch((e) => {
              res.status(409).json({
                message: {
                  success: true,
                  data: 'Role not found',
                },
              });
            }); */
        })
        .catch((e) => {
            res.status(409)
                .json({
                    message: {
                        success: true,
                        data: 'Role not found',
                    },
                });
        });
}

export function addResource(req, res) {
    const resource = {
        resource_client_id: req.authData.PM_Client_ID,
        resource_user_id: req.body.userId,
        resource_user_role: req.body.roles,
        resource_project_id: req.body.projectId,
        resource_status: 1,
    };
    const body = {
        PM_Client_ID: req.authData.PM_Client_ID,
        PM_Project_ID: req.body.projectId,
    };
    userResource.findOrCreate({where: {resource_client_id: req.authData.PM_Client_ID, resource_user_id: req.body.userId, resource_project_id: req.body.projectId}, defaults: resource})
        .spread((user, created) => {
            if(!created) {
                userResource.update(resource,
                    {where: {resource_client_id: req.authData.PM_Client_ID, resource_user_id: req.body.userId, resource_project_id: req.body.projectId}})
                    .then((results) => {
                        if(results[0] === 1) {
                            res.status(200)
                                .json({status: 200, data: {success: true, msg: 'User added to resource successfully'}});
                            showDetailsProject(body)
                                .then((projectDetails) => {
                                    if(projectDetails.length !== 0) {
                                        // console.log('projectDetails ', projectDetails);
                                        const bodyWelcome = {
                                            clientId: req.authData.PM_Client_ID,
                                            senderId: req.authData.PM_UserID,
                                            senderEmail: req.authData.PM_User_Email_ID,
                                            senderMobile: req.authData.PM_User_MobileNumber,
                                            messageType: 'assigned',
                                            subject: `${req.authData.PM_User_FullName} ${process.env.ASSIGNED_PROJECT}`,
                                            priority: 'low',
                                            projectId: projectDetails[0].PM_Project_ID,
                                            recipientsAndData: [
                                                {
                                                    email: req.body.userEmail,
                                                    // mob: req.body.userMobile,
                                                    data: `${req.body.userName}|
                        ${req.authData.PM_User_FullName} ${process.env.ASSIGNED_PROJECT}|
                        ${projectDetails[0].PM_Project_Name}|
                        ${process.env.PROTOCOL}${req.authData.PM_Domain.toLowerCase()}.${process.env.MAIN_DOMAIN}|
                        ${req.authData.PM_Domain.toLowerCase()}.${process.env.MAIN_DOMAIN}|
                        none|
                        none|
                        none|
                        none|
                        ${process.env.PROTOCOL}${req.authData.PM_Domain.toLowerCase()}.${process.env.MAIN_DOMAIN}${process.env.GOTO_PROJECT}|
                        Perform Project`,
                                                },
                                            ],
                                        };
                                        saveEmailSmsBacked(bodyWelcome);
                                    }
                                })
                                .catch((err) => {
                                    console.log('errrr ', err);
                                });
                        } else {
                            res.status(200)
                                .json({status: 200, data: {success: true, msg: 'User Cant be added to resource'}});
                        }
                    })
                    .catch((err) => {
                        res.status(409)
                            .json({status: 200, data: {success: false, msg: err}});
                    });
            } else {
                res.send({status: 200, data: {success: true, msg: 'User added to resource successfully'}});
                showDetailsProject(body)
                    .then((projectDetails) => {
                        if(projectDetails.length !== 0) {
                            // console.log('projectDetails ', projectDetails);
                            const bodyWelcome = {
                                clientId: req.authData.PM_Client_ID,
                                senderId: req.authData.PM_UserID,
                                senderEmail: req.authData.PM_User_Email_ID,
                                senderMobile: req.authData.PM_User_MobileNumber,
                                messageType: 'assigned',
                                subject: `${req.authData.PM_User_FullName} ${process.env.ASSIGNED_PROJECT}`,
                                priority: 'low',
                                projectId: projectDetails[0].PM_Project_ID,
                                recipientsAndData: [
                                    {
                                        email: req.body.userEmail,
                                        // mob: req.body.userMobile,
                                        data: `${req.body.userName}|
                        ${req.authData.PM_User_FullName} ${process.env.ASSIGNED_PROJECT}|
                        ${projectDetails[0].PM_Project_Name}|
                        ${process.env.PROTOCOL}${req.authData.PM_Domain.toLowerCase()}.${process.env.MAIN_DOMAIN}|
                        none|
                        none|
                        none|
                        none|
                        ${process.env.PROTOCOL}${req.authData.PM_Domain.toLowerCase()}.${process.env.MAIN_DOMAIN}${process.env.GOTO_PROJECT}|
                        Perform Project|
                        ${req.authData.PM_Domain.toLowerCase()}.${process.env.MAIN_DOMAIN}`,
                                    },
                                ],
                            };
                            saveEmailSmsBacked(bodyWelcome);
                        }
                    })
                    .catch((err) => {
                        console.log('errrr ', err);
                    });
            }
        });
}

export function updateResource(req, res) {
    const resource = {
        resource_user_role: req.body.roles,
    };
    userResource.update(resource,
        {where: {resource_client_id: req.authData.PM_Client_ID, resource_user_id: req.body.userId}})
        .then((results) => {
            if(results[0] === 1) {
                res.status(200)
                    .json({status: 200, data: {success: true, msg: 'User Updated Successfully'}});
            } else {
                res.status(200)
                    .json({status: 200, data: {success: true, msg: 'User Cant be update'}});
            }
        })
        .catch((err) => {
            res.status(409)
                .json({status: 200, data: {success: false, msg: err.errors[0].message}});
        });
}

export function getOnlyResources(req, res) {
    let likeCause = '';
    let limitValue;
    let skip;
    if(req.query.q) {
        likeCause = req.query.q;
    }
    // const query = {
    //   where: { PM_Client_ID: req.authData.PM_Client_ID,
    //     PM_User_Active: 1,
    //   },
    //   order: [
    //     ['PM_UserID', 'DESC'],
    //   ],
    //   attributes: ['PM_UserID', 'PM_User_Email_ID', 'PM_User_MobileNumber', 'PM_User_Role',
    //     'PM_User_Department', 'PM_User_FullName', 'PM_User_Address', 'PM_User_State', 'PM_User_District',
    //     'PM_User_Village', 'PM_User_Pincode', 'PM_Designation', 'PM_User_ProfilePic'],
    //   raw: true,
    // };
    // if (req.query.limit && req.query.limit !== '' && req.query.skip && req.query.skip !== '') {
    //   limitValue = parseInt(req.query.limit, 10);
    //   skip = parseInt(req.query.skip, 10);
    //   skip *= limitValue;
    //   query.offset = skip;
    //   query.limit = limitValue;
    // }

    const query = {
        where: {
            PM_Client_ID: req.authData.PM_Client_ID,
            PM_User_Active: 1,
            PM_User_FullName: {[Sequelize.Op.like]: `%${likeCause}%`}
        },
        order: [
            ['PM_UserID', 'DESC'],
        ],
        attributes: ['PM_UserID', 'PM_User_Email_ID', 'PM_User_MobileNumber', 'PM_User_Role',
            'PM_User_Department', 'PM_User_FullName', 'PM_User_Address', 'PM_User_State', 'PM_User_District',
            'PM_User_Village', 'PM_User_Pincode', 'PM_Designation', 'PM_User_ProfilePic'],
        raw: true,
        include: [{
            model: UserRole,
            as: 'User',
            where: {clientID: req.authData.PM_Client_ID, status: 1},
            attributes: ['roleID'],
            required: false,
            include: [{
                model: Role,
                as: 'UserRole1',
                where: {PM_Client_ID: req.authData.PM_Client_ID, Status: 1},
                attributes: ['ID', 'Description'],
                required: false,
            }],
        }],
    };
    RegisterUser.findAll(query)
        .then((results) => {
            getAllUser(results)
                .then((data) => {
                    const userList = [];
                    data.forEach((item) => {
                        const newUser = {};
                        const newRole = {};
                        // if (userList.length > 0) {
                        const index = userList.findIndex(u => u.PM_UserID === item.PM_UserID);
                        if(index >= 0) { // user is already in userList just push role of that user in Role
                            newRole.ID = item['User.roleID'];
                            newRole.Description = item['User.UserRole1.Description'];
                            userList[index].PM_User_Role.push(newRole);
                            // userList[index].role.push(newRole);
                        } else {
                            newUser.PM_UserID = item.PM_UserID;
                            newUser.PM_User_Email_ID = item.PM_User_Email_ID;
                            newUser.PM_User_MobileNumber = item.PM_User_MobileNumber;
                            newUser.PM_User_Department = item.PM_User_Department;
                            newUser.PM_User_FullName = item.PM_User_FullName;
                            newUser.PM_Designation = item.PM_Designation;
                            newUser.PM_User_ProfilePic = item.PM_User_ProfilePic;
                            newUser.PM_User_Role = [];
                            // newUser.role = [];
                            newRole.ID = item['User.roleID'];
                            newRole.Description = item['User.UserRole1.Description'];
                            newUser.PM_User_Role.push(newRole);
                            // newUser.role.push(newRole);
                            userList.push(newUser);
                        }
                        // }
                    });
                    userList.forEach((item) => {
                        item.PM_User_Role = item.PM_User_Role.map(map => map.ID);
                        item.PM_User_Role = item.PM_User_Role.toString();
                    });
                    data = userList;
                    const resourceData = [];
                    Role.findAll({
                        where: {PM_Client_ID: req.authData.PM_Client_ID},
                        order: [
                            ['ID', 'DESC'],
                        ],
                        attributes: ['ID', 'Description'],
                        raw: true,
                    })
                        .then((roles) => {
                            // res.send(data);
                            userResource.findAll({
                                where: {resource_client_id: req.authData.PM_Client_ID, resource_project_id: Number(req.params.projectId), resource_status: 1},
                                order: [
                                    ['resource_project_id', 'DESC'],
                                ],
                                attributes: ['resource_id', 'resource_client_id', 'resource_project_id', 'resource_user_id', 'resource_user_role', 'resource_status'],
                                raw: true,
                            })
                                .then((userResources) => {
                                    if(userResources) {
                                        data.forEach((user) => {
                                            user.updateResource = false;
                                            if(user.PM_User_Role) {
                                                user.PM_User_Role = user.PM_User_Role.split(',');
                                                user.PM_User_Role = user.PM_User_Role.map(key => parseInt(key, 10));
                                                user.role = [];
                                                user.PM_User_Role = user.PM_User_Role.map((roleId, index) => {
                                                    const userRole = roles.filter(usrRole => roleId === usrRole.ID);
                                                    if(userRole) {
                                                        user.role[index] = {};
                                                        user.role[index] = userRole[0];
                                                    }
                                                    return userRole[0];
                                                });
                                            }

                                            userResources.forEach((userRes) => {
                                                if(parseInt(userRes.resource_user_id, 10) === parseInt(user.PM_UserID, 10)) {
                                                    user.role = [];
                                                    user.resource_id = userRes.resource_id;
                                                    user.updateResource = true;
                                                    if(userRes.resource_user_role) {
                                                        userRes.resource_user_role = userRes.resource_user_role.split(',');
                                                        userRes.resource_user_role = userRes.resource_user_role.map(key => parseInt(key, 10),
                                                        );
                                                        userRes.resource_user_role.forEach((roleId, index) => {
                                                            const userRole = roles.filter(usrRole => roleId === usrRole.ID);
                                                            if(userRole) {
                                                                user.role[index] = {};
                                                                user.role[index] = userRole[0];
                                                            }
                                                        });
                                                    }

                                                    resourceData.push(user);
                                                }
                                            });
                                        });
                                    }
                                    if(resourceData.length > 0) {
                                        res.send({status: 200, message: {success: true, data: resourceData}});
                                    } else {
                                        res.send({status: 200, message: {success: false, data: 'Add Your Resources'}});
                                    }
                                    // res.send(resourceData);
                                });
                        });
                });
        });
}

export function getOnlyResourcesForMultipleProjects(req, res) {
    if(req.body.projectList.length !== 0 && req.body.roles.length !== 0) {
        // for project and roles based
        const projectIds = [];
        const roleIds = [];
        for(let i = 0; i < req.body.projectList.length; i += 1) {
            projectIds.push(req.body.projectList[i].PM_Project_ID);
        }
        for(let i = 0; i < req.body.roles.length; i += 1) {
            roleIds.push(req.body.roles[i].ID);
        }

        if(req.body.isWeb || req.body.isMob) {
            if(!req.body.isMob && req.body.isWeb) {
                // Web User
                RegisterUser.findAll({
                    where: {
                        PM_UserID: {[Sequelize.Op.ne]: req.authData.PM_UserID},
                        PM_Client_ID: req.authData.PM_Client_ID,
                    },
                    include: [
                        {
                            model: userResource,
                            as: 'UserResource',
                            where: {
                                resource_project_id: {[Sequelize.Op.in]: projectIds},
                                resource_client_id: req.authData.PM_Client_ID,
                                resource_user_role: {[Sequelize.Op.in]: roleIds},
                                resource_status: true,
                            },
                            attributes: ['resource_user_id', 'resource_user_role'],
                            include: [{
                                model: resourceRole,
                                as: 'resourceRole',
                                where: {resource_role_status: 1},
                                include: [{
                                    model: Role,
                                    as: 'UserRole3',
                                    // required: false,
                                    where: {
                                        IsWeb: req.body.isWeb,
                                        PM_Client_ID: req.authData.PM_Client_ID,
                                        Status: 1,
                                    },
                                }],
                            }],
                        },
                    ],
                    // order: [[{ model: userResource, as: 'UserResource' }, 'createdAt', 'DESC']],
                    order: [['PM_User_FullName', 'ASC']],
                    attributes: [
                        'PM_UserID',
                        'PM_User_FullName',
                    ],
                    raw: true,
                })
                    .then((results) => {
                        let users = results;
                        users = _.uniqBy(users, 'PM_UserID');
                        return res.json(users);
                    })
                    .catch((err) => {
                        res.json(err);
                    });
            } else if(!req.body.isWeb && req.body.isMob) {
                // Mob User
                RegisterUser.findAll({
                    where: {
                        PM_UserID: {[Sequelize.Op.ne]: req.authData.PM_UserID},
                        PM_Client_ID: req.authData.PM_Client_ID,
                    },
                    include: [
                        {
                            model: userResource,
                            as: 'UserResource',
                            where: {
                                resource_project_id: {[Sequelize.Op.in]: projectIds},
                                resource_client_id: req.authData.PM_Client_ID,
                                resource_user_role: {[Sequelize.Op.in]: roleIds},
                                resource_status: true,
                            },
                            attributes: ['resource_user_id', 'resource_user_role'],
                            include: [{
                                model: resourceRole,
                                as: 'resourceRole',
                                where: {resource_role_status: 1},
                                include: [{
                                    model: Role,
                                    as: 'UserRole3',
                                    // required: false,
                                    where: {
                                        IsMobile: req.body.isMob,
                                        PM_Client_ID: req.authData.PM_Client_ID,
                                        Status: 1,
                                    },
                                }],
                            }],
                        },
                    ],
                    // order: [[{ model: userResource, as: 'UserResource' }, 'createdAt', 'DESC']],
                    order: [['PM_User_FullName', 'ASC']],
                    attributes: [
                        'PM_UserID',
                        'PM_User_FullName',
                    ],
                    raw: true,
                })
                    .then((results) => {
                        let users = results;
                        users = _.uniqBy(users, 'PM_UserID');
                        return res.json(users);
                    })
                    .catch((err) => {
                        res.json(err);
                    });
            } else if(req.body.isWeb && req.body.isMob) {
                // Web & Mob User
                RegisterUser.findAll({
                    where: {
                        PM_UserID: {[Sequelize.Op.ne]: req.authData.PM_UserID},
                        PM_Client_ID: req.authData.PM_Client_ID,
                    },
                    include: [
                        {
                            model: userResource,
                            as: 'UserResource',
                            where: {
                                resource_project_id: {[Sequelize.Op.in]: projectIds},
                                resource_client_id: req.authData.PM_Client_ID,
                                resource_user_role: {[Sequelize.Op.in]: roleIds},
                                resource_status: true,
                            },
                            attributes: ['resource_user_id', 'resource_user_role'],
                            include: [{
                                model: resourceRole,
                                as: 'resourceRole',
                                where: {resource_role_status: 1},
                                include: [{
                                    model: Role,
                                    as: 'UserRole3',
                                    // required: false,
                                    where: {
                                        [Sequelize.Op.and]: [{IsWeb: req.body.isWeb}, {IsMobile: req.body.isMob}],
                                        PM_Client_ID: req.authData.PM_Client_ID,
                                        Status: 1,
                                    },
                                }],
                            }],
                        },
                    ],
                    // order: [[{ model: userResource, as: 'UserResource' }, 'createdAt', 'DESC']],
                    order: [['PM_User_FullName', 'ASC']],
                    attributes: [
                        'PM_UserID',
                        'PM_User_FullName',
                    ],
                    raw: true,
                })
                    .then((results) => {
                        let users = results;
                        users = _.uniqBy(users, 'PM_UserID');
                        return res.json(users);
                    })
                    .catch((err) => {
                        res.json(err);
                    });
            }
        } else {
            RegisterUser.findAll({
                where: {
                    PM_UserID: {[Sequelize.Op.ne]: req.authData.PM_UserID},
                    PM_Client_ID: req.authData.PM_Client_ID,
                },
                include: [
                    {
                        model: userResource,
                        as: 'UserResource',
                        where: {
                            resource_project_id: {[Sequelize.Op.in]: projectIds},
                            resource_client_id: req.authData.PM_Client_ID,
                            resource_user_role: {[Sequelize.Op.in]: roleIds},
                            resource_status: true,
                        },
                        attributes: ['resource_user_id', 'resource_user_role'],
                        include: [{
                            model: resourceRole,
                            as: 'resourceRole',
                            where: {resource_role_status: 1},
                        }],
                    },
                ],
                // order: [[{ model: userResource, as: 'UserResource' }, 'createdAt', 'DESC']],
                order: [['PM_User_FullName', 'ASC']],
                attributes: [
                    'PM_UserID',
                    'PM_User_FullName',
                ],
                raw: true,
            })
                .then((results) => {
                    let users = results;
                    users = _.uniqBy(users, 'PM_UserID');
                    return res.json(users);
                })
                .catch((err) => {
                    res.json(err);
                });
        }
    } else if(req.body.projectList.length !== 0) {
        // project list
        const projectIds = [];
        for(let i = 0; i < req.body.projectList.length; i += 1) {
            projectIds.push(req.body.projectList[i].PM_Project_ID);
        }
        if(req.body.isWeb || req.body.isMob) {
            if(!req.body.isMob && req.body.isWeb) {
                // Web User
                RegisterUser.findAll({
                    where: {
                        PM_UserID: {[Sequelize.Op.ne]: req.authData.PM_UserID},
                        PM_Client_ID: req.authData.PM_Client_ID,
                    },
                    include: [
                        {
                            model: userResource,
                            as: 'UserResource',
                            where: {resource_project_id: {[Sequelize.Op.in]: projectIds}, resource_client_id: req.authData.PM_Client_ID, resource_status: true},
                            attributes: ['resource_user_id'],
                            include: [{
                                model: resourceRole,
                                as: 'resourceRole',
                                where: {resource_role_status: 1},
                                include: [{
                                    model: Role,
                                    as: 'UserRole3',
                                    // required: false,
                                    where: {
                                        IsWeb: req.body.isWeb,
                                        PM_Client_ID: req.authData.PM_Client_ID,
                                        Status: 1,
                                    },
                                }],
                            }],
                        },
                    ],
                    // order: [[{ model: userResource, as: 'UserResource' }, 'createdAt', 'DESC']],
                    order: [['PM_User_FullName', 'ASC']],
                    attributes: [
                        'PM_UserID',
                        'PM_User_FullName',
                    ],
                    raw: true,
                })
                    .then((results) => {
                        let data = results;
                        data = _.uniqBy(data, 'PM_UserID');
                        res.json(data);
                    })
                    .catch((err) => {
                        res.json(err);
                    });
            } else if(!req.body.isWeb && req.body.isMob) {
                // Mob User
                RegisterUser.findAll({
                    where: {
                        PM_UserID: {[Sequelize.Op.ne]: req.authData.PM_UserID},
                        PM_Client_ID: req.authData.PM_Client_ID,
                    },
                    include: [
                        {
                            model: userResource,
                            as: 'UserResource',
                            where: {resource_project_id: {[Sequelize.Op.in]: projectIds}, resource_client_id: req.authData.PM_Client_ID, resource_status: true},
                            attributes: ['resource_user_id'],
                            include: [{
                                model: resourceRole,
                                as: 'resourceRole',
                                where: {resource_role_status: 1},
                                include: [{
                                    model: Role,
                                    as: 'UserRole3',
                                    // required: false,
                                    where: {
                                        IsMobile: req.body.isMob,
                                        PM_Client_ID: req.authData.PM_Client_ID,
                                        Status: 1,
                                    },
                                }],
                            }],
                        },
                    ],
                    // order: [[{ model: userResource, as: 'UserResource' }, 'createdAt', 'DESC']],
                    order: [['PM_User_FullName', 'ASC']],
                    attributes: [
                        'PM_UserID',
                        'PM_User_FullName',
                    ],
                    raw: true,
                })
                    .then((results) => {
                        let data = results;
                        data = _.uniqBy(data, 'PM_UserID');
                        res.json(data);
                    })
                    .catch((err) => {
                        res.json(err);
                    });
            } else if(req.body.isWeb && req.body.isMob) {
                // Web & Mob User
                RegisterUser.findAll({
                    where: {
                        PM_UserID: {[Sequelize.Op.ne]: req.authData.PM_UserID},
                        PM_Client_ID: req.authData.PM_Client_ID,
                    },
                    include: [
                        {
                            model: userResource,
                            as: 'UserResource',
                            where: {resource_project_id: {[Sequelize.Op.in]: projectIds}, resource_client_id: req.authData.PM_Client_ID, resource_status: true},
                            attributes: ['resource_user_id'],
                            include: [{
                                model: resourceRole,
                                as: 'resourceRole',
                                where: {resource_role_status: 1},
                                include: [{
                                    model: Role,
                                    as: 'UserRole3',
                                    // required: false,
                                    where: {
                                        [Sequelize.Op.and]: [{IsWeb: req.body.isWeb}, {IsMobile: req.body.isMob}],
                                        PM_Client_ID: req.authData.PM_Client_ID,
                                        Status: 1,
                                    },
                                }],
                            }],
                        },
                    ],
                    // order: [[{ model: userResource, as: 'UserResource' }, 'createdAt', 'DESC']],
                    order: [['PM_User_FullName', 'ASC']],
                    attributes: [
                        'PM_UserID',
                        'PM_User_FullName',
                    ],
                    raw: true,
                })
                    .then((results) => {
                        let data = results;
                        data = _.uniqBy(data, 'PM_UserID');
                        res.json(data);
                    })
                    .catch((err) => {
                        res.json(err);
                    });
            }
        } else {
            RegisterUser.findAll({
                where: {
                    PM_UserID: {[Sequelize.Op.ne]: req.authData.PM_UserID},
                    PM_Client_ID: req.authData.PM_Client_ID,
                },
                include: [
                    {
                        model: userResource,
                        as: 'UserResource',
                        where: {resource_project_id: {[Sequelize.Op.in]: projectIds}, resource_client_id: req.authData.PM_Client_ID, resource_status: true},
                        attributes: ['resource_user_id'],
                    },
                ],
                // order: [[{ model: userResource, as: 'UserResource' }, 'createdAt', 'DESC']],
                order: [['PM_User_FullName', 'ASC']],
                attributes: [
                    'PM_UserID',
                    'PM_User_FullName',
                ],
                raw: true,
            })
                .then((results) => {
                    let data = results;
                    data = _.uniqBy(data, 'PM_UserID');
                    res.json(data);
                })
                .catch((err) => {
                    res.json(err);
                });
        }
    } else if(req.body.roles.length !== 0) {
        // roles based done
        const roleList = [];
        for(let i = 0; i < req.body.roles.length; i += 1) {
            roleList.push(req.body.roles[i].ID);
        }
        if(req.body.isWeb || req.body.isMob) {
            if(!req.body.isMob && req.body.isWeb) {
                // Web User
                RegisterUser.findAll({
                    where: {
                        PM_UserID: {[Sequelize.Op.ne]: req.authData.PM_UserID},
                        PM_Client_ID: req.authData.PM_Client_ID,
                    },
                    include: [
                        {
                            model: UserRole,
                            as: 'User',
                            where: {roleID: {[Sequelize.Op.in]: roleList}, clientID: req.authData.PM_Client_ID, Status: 1},
                            attributes: ['roleID', 'userID'],
                            // required: false,
                            include: [{
                                model: Role,
                                as: 'UserRole1',
                                // required: false,
                                where: {
                                    IsWeb: req.body.isWeb,
                                    PM_Client_ID: req.authData.PM_Client_ID,
                                    Status: 1,
                                },
                            }],
                        },
                    ],
                    // order: [['createdAt', 'DESC']],
                    order: [['PM_User_FullName', 'ASC']],
                    attributes: [
                        'PM_UserID',
                        'PM_User_FullName',
                    ],
                    raw: true,
                })
                    .then((results) => {
                        let data = results;
                        data = _.uniqBy(data, 'PM_UserID');
                        res.json(data);
                    })
                    .catch((err) => {
                        res.json(err);
                    });
            } else if(!req.body.isWeb && req.body.isMob) {
                // Mob User
                RegisterUser.findAll({
                    where: {
                        PM_UserID: {[Sequelize.Op.ne]: req.authData.PM_UserID},
                        PM_Client_ID: req.authData.PM_Client_ID,
                    },
                    include: [
                        {
                            model: UserRole,
                            as: 'User',
                            where: {roleID: {[Sequelize.Op.in]: roleList}, clientID: req.authData.PM_Client_ID, Status: 1},
                            attributes: ['roleID', 'userID'],
                            include: [{
                                model: Role,
                                as: 'UserRole1',
                                where: {
                                    IsMobile: req.body.isMob,
                                    PM_Client_ID: req.authData.PM_Client_ID,
                                    Status: 1,
                                },
                            }],
                        },
                    ],
                    // order: [['createdAt', 'DESC']],
                    order: [['PM_User_FullName', 'ASC']],
                    attributes: [
                        'PM_UserID',
                        'PM_User_FullName',
                    ],
                    raw: true,
                })
                    .then((results) => {
                        let data = results;
                        data = _.uniqBy(data, 'PM_UserID');
                        res.json(data);
                    })
                    .catch((err) => {
                        res.json(err);
                    });
            } else if(req.body.isWeb && req.body.isMob) {
                // Web & Mob User
                RegisterUser.findAll({
                    where: {
                        PM_UserID: {[Sequelize.Op.ne]: req.authData.PM_UserID},
                        PM_Client_ID: req.authData.PM_Client_ID,
                    },
                    include: [
                        {
                            model: UserRole,
                            as: 'User',
                            where: {roleID: {[Sequelize.Op.in]: roleList}, clientID: req.authData.PM_Client_ID, Status: 1},
                            attributes: ['roleID', 'userID'],
                            include: [{
                                model: Role,
                                as: 'UserRole1',
                                where: {
                                    [Sequelize.Op.or]: [{IsWeb: req.body.isWeb}, {IsMobile: req.body.isMob}],
                                    PM_Client_ID: req.authData.PM_Client_ID,
                                    Status: 1,
                                },
                            }],
                        },
                    ],
                    // order: [['createdAt', 'DESC']],
                    order: [['PM_User_FullName', 'ASC']],
                    attributes: [
                        'PM_UserID',
                        'PM_User_FullName',
                    ],
                    raw: true,
                })
                    .then((results) => {
                        let data = results;
                        data = _.uniqBy(data, 'PM_UserID');
                        res.json(data);
                    })
                    .catch((err) => {
                        res.json(err);
                    });
            }
        } else {
            RegisterUser.findAll({
                where: {
                    PM_UserID: {[Sequelize.Op.ne]: req.authData.PM_UserID},
                    PM_Client_ID: req.authData.PM_Client_ID,
                },
                include: [
                    {
                        model: UserRole,
                        as: 'User',
                        where: {roleID: {[Sequelize.Op.in]: roleList}, clientID: req.authData.PM_Client_ID, Status: true},
                        attributes: ['roleID', 'userID'],
                    },
                ],
                // order: [['createdAt', 'DESC']],
                order: [['PM_User_FullName', 'ASC']],
                attributes: [
                    'PM_UserID',
                    'PM_User_FullName',
                ],
                raw: true,
            })
                .then((results) => {
                    let data = results;
                    data = _.uniqBy(data, 'PM_UserID');
                    res.json(data);
                })
                .catch((err) => {
                    res.json(err);
                });
        }
    } else if(req.body.isWeb || req.body.isMob) {
        if(!req.body.isMob && req.body.isWeb) {
            // Web User
            RegisterUser.findAll({
                where: {
                    PM_UserID: {[Sequelize.Op.ne]: req.authData.PM_UserID},
                    PM_Client_ID: req.authData.PM_Client_ID,
                },
                include: [
                    {
                        model: UserRole,
                        as: 'User',
                        where: {clientID: req.authData.PM_Client_ID, Status: 1},
                        attributes: ['roleID', 'userID'],
                        // required: false,
                        include: [{
                            model: Role,
                            as: 'UserRole1',
                            // required: false,
                            where: {
                                IsWeb: req.body.isWeb,
                                PM_Client_ID: req.authData.PM_Client_ID,
                                Status: 1,
                            },
                        }],
                    },
                ],
                // order: [['createdAt', 'DESC']],
                order: [['PM_User_FullName', 'ASC']],
                attributes: [
                    'PM_UserID',
                    'PM_User_FullName',
                ],
                raw: true,
            })
                .then((results) => {
                    let data = results;
                    data = _.uniqBy(data, 'PM_UserID');
                    res.json(data);
                })
                .catch((err) => {
                    res.json(err);
                });
        } else if(!req.body.isWeb && req.body.isMob) {
            // Mob User
            RegisterUser.findAll({
                where: {
                    PM_UserID: {[Sequelize.Op.ne]: req.authData.PM_UserID},
                    PM_Client_ID: req.authData.PM_Client_ID,
                },
                include: [
                    {
                        model: UserRole,
                        as: 'User',
                        where: {clientID: req.authData.PM_Client_ID, Status: 1},
                        attributes: ['roleID', 'userID'],
                        include: [{
                            model: Role,
                            as: 'UserRole1',
                            where: {
                                IsMobile: req.body.isMob,
                                PM_Client_ID: req.authData.PM_Client_ID,
                                Status: 1,
                            },
                        }],
                    },
                ],
                // order: [['createdAt', 'DESC']],
                order: [['PM_User_FullName', 'ASC']],
                attributes: [
                    'PM_UserID',
                    'PM_User_FullName',
                ],
                raw: true,
            })
                .then((results) => {
                    let data = results;
                    data = _.uniqBy(data, 'PM_UserID');
                    res.json(data);
                })
                .catch((err) => {
                    res.json(err);
                });
        } else if(req.body.isWeb && req.body.isMob) {
            // Web & Mob User
            RegisterUser.findAll({
                where: {
                    PM_UserID: {[Sequelize.Op.ne]: req.authData.PM_UserID},
                    PM_Client_ID: req.authData.PM_Client_ID,
                },
                include: [
                    {
                        model: UserRole,
                        as: 'User',
                        where: {clientID: req.authData.PM_Client_ID, Status: 1},
                        attributes: ['roleID', 'userID'],
                        include: [{
                            model: Role,
                            as: 'UserRole1',
                            where: {
                                [Sequelize.Op.or]: [{IsWeb: req.body.isWeb}, {IsMobile: req.body.isMob}],
                                PM_Client_ID: req.authData.PM_Client_ID,
                                Status: 1,
                            },
                        }],
                    },
                ],
                // order: [['createdAt', 'DESC']],
                order: [['PM_User_FullName', 'ASC']],
                attributes: [
                    'PM_UserID',
                    'PM_User_FullName',
                ],
                raw: true,
            })
                .then((results) => {
                    let data = results;
                    data = _.uniqBy(data, 'PM_UserID');
                    res.json(data);
                })
                .catch((err) => {
                    res.json(err);
                });
        }
    } else {
        return res.json([]);
    }
}

export function removeResource(req, res) {
    const clientID = req.authData.PM_Client_ID;
    const projectID = req.body.projectId;
    let resourceId = req.body.resourceId;

    const resource = {
        resource_status: 0,
    };
    const body = {
        PM_Client_ID: req.authData.PM_Client_ID,
        PM_Project_ID: req.body.projectId,
    };
    userResource.update(resource,
        {where: {resource_id: req.body.resourceId}})
        .then((results) => {
            if(results[0] === 1) {
                userResource.findOne({where: {resource_id: resourceId}})
                    .then((result) => {
                        resourceId = result.resource_user_id;

                        Task.findAll({
                            where: {
                                PM_Client_ID: clientID,
                                PM_Project_ID: projectID
                            }
                        })
                            .then((task) => {
                                for(let i = 0; i < task.length; i += 1) {
                                    const obj = {};

                                    obj.assignee = task[i].PM_Task_Assignee;
                                    if(obj.assignee === resourceId) {
                                        obj.assignee = null;
                                    }
                                    obj.auditor = task[i].PM_Task_Auditor;
                                    if(obj.auditor === resourceId) {
                                        obj.auditor = null;
                                    }
                                    obj.approver = task[i].PM_Task_Approver;
                                    if(obj.approver === resourceId) {
                                        obj.approver = null;
                                    }

                                    Task.update({
                                        PM_Task_Assignee: obj.assignee,
                                        PM_Task_Auditor: obj.auditor,
                                        PM_Task_Approver: obj.approver,
                                    }, {
                                        where: {
                                            PM_Client_ID: clientID,
                                            PM_Project_ID: projectID,
                                            PM_Task_ID: task[i].PM_Task_ID,
                                        }
                                    });
                                }
                            })
                            .then(() => {
                                Milestone.findAll({
                                    where: {
                                        PM_Client_ID: clientID,
                                        PM_Project_ID: projectID
                                    }
                                })
                                    .then((mile) => {
                                        for(let i = 0; i < mile.length; i += 1) {
                                            const obj = {};

                                            obj.assignee = mile[i].PM_Milestone_Assignee;
                                            if(obj.assignee === resourceId) {
                                                obj.assignee = null;
                                            }

                                            obj.auditor = mile[i].PM_Milestone_Auditor;
                                            if(obj.auditor === resourceId) {
                                                obj.auditor = null;
                                            }

                                            obj.approver = mile[i].PM_Milestone_Approver;
                                            if(obj.approver === resourceId) {
                                                obj.approver = null;
                                            }

                                            Milestone.update({
                                                PM_Milestone_Assignee: obj.assignee,
                                                PM_Milestone_Auditor: obj.auditor,
                                                PM_Milestone_Approver: obj.approver,
                                            }, {
                                                where: {
                                                    PM_Client_ID: clientID,
                                                    PM_Project_ID: projectID,
                                                    PM_Milestone_ID: mile[i].PM_Milestone_ID,
                                                }
                                            });
                                        }
                                    });
                            })
                            .then(() => {
                                SubProject.findAll({
                                    where: {
                                        PM_Client_ID: clientID,
                                        PM_Project_ID: projectID
                                    }
                                })
                                    .then((subproject) => {
                                        for(let i = 0; i < subproject.length; i += 1) {
                                            const obj = {};

                                            obj.assignee = subproject[i].PM_SubProject_Assignee;
                                            if(obj.assignee === resourceId) {
                                                obj.assignee = null;
                                            }

                                            obj.auditor = subproject[i].PM_SubProject_Auditor;
                                            if(obj.auditor === resourceId) {
                                                obj.auditor = null;
                                            }

                                            obj.approver = subproject[i].PM_SubProject_Approver;
                                            if(obj.approver === resourceId) {
                                                obj.approver = null;
                                            }

                                            SubProject.update({
                                                PM_SubProject_Assignee: obj.assignee,
                                                PM_SubProject_Auditor: obj.auditor,
                                                PM_SubProject_Approver: obj.approver,
                                            }, {
                                                where: {
                                                    PM_Client_ID: clientID,
                                                    PM_Project_ID: projectID,
                                                    PM_SubProject_ID: subproject[i].PM_SubProject_ID,
                                                }
                                            });
                                        }
                                    });
                            })
                            .then(() => {
                                Audit.findAll({
                                    where: {
                                        PM_Client_ID: clientID,
                                        PM_Project_ID: projectID
                                    }
                                })
                                    .then((audit) => {
                                        for(let i = 0; i < audit.length; i += 1) {
                                            const obj = {};

                                            obj.PM_Auditor_ID = audit[i].PM_Auditor_ID;
                                            if(obj.PM_Auditor_ID === resourceId) {
                                                obj.PM_Auditor_ID = null;
                                            }

                                            Audit.update({
                                                PM_Auditor_ID: obj.PM_Auditor_ID,
                                            }, {
                                                where: {
                                                    PM_Client_ID: clientID,
                                                    PM_Project_ID: projectID,
                                                    Audit_Status: null,
                                                    PM_Audit_ID: audit[i].PM_Audit_ID,
                                                }
                                            });
                                        }
                                    });
                            })
                            .then(() => {
                                Approve.findAll({
                                    where: {
                                        PM_Client_ID: clientID,
                                        PM_Project_ID: projectID
                                    }
                                })
                                    .then((approve) => {
                                        for(let i = 0; i < approve.length; i += 1) {
                                            const obj = {};

                                            obj.Approver_UserID = approve[i].Approver_UserID;
                                            if(obj.Approver_UserID === resourceId) {
                                                obj.Approver_UserID = null;
                                            }

                                            Approve.update({
                                                Approver_UserID: obj.Approver_UserID,
                                            }, {
                                                where: {
                                                    PM_Client_ID: clientID,
                                                    PM_Project_ID: projectID,
                                                    PM_Approve_Status: null,
                                                    PM_Approve_ID: approve[i].PM_Approve_ID,
                                                }
                                            })
                                                .then(() => {
                                                    res.status(200)
                                                        .json({status: 200, data: {success: true, msg: 'User removed from resource Successfully'}});
                                                    showDetailsProject(body)
                                                        .then((projectDetails) => {
                                                            if(projectDetails.length !== 0) {
                                                                // console.log('projectDetails ', projectDetails);
                                                                const bodyWelcome = {
                                                                    clientId: req.authData.PM_Client_ID,
                                                                    senderId: req.authData.PM_UserID,
                                                                    senderEmail: req.authData.PM_User_Email_ID,
                                                                    senderMobile: req.authData.PM_User_MobileNumber,
                                                                    messageType: 'assigned',
                                                                    subject: `${req.authData.PM_User_FullName} ${process.env.REMOVED_PROJECT}`,
                                                                    priority: 'low',
                                                                    projectId: projectDetails[0].PM_Project_ID,
                                                                    recipientsAndData: [
                                                                        {
                                                                            email: req.body.userEmail,
                                                                            // mob: req.body.userMobile,
                                                                            data: `${req.body.userName}|
                        ${req.authData.PM_User_FullName} ${process.env.REMOVED_PROJECT}|
                        ${projectDetails[0].PM_Project_Name}|
                        ${process.env.PROTOCOL}${req.authData.PM_Domain.toLowerCase()}.${process.env.MAIN_DOMAIN}|
                        ${req.authData.PM_Domain.toLowerCase()}.${process.env.MAIN_DOMAIN}|
                        none|
                        none|
                        none|
                        none`,
                                                                        },
                                                                    ],
                                                                };
                                                                saveEmailSmsBacked(bodyWelcome);
                                                            }
                                                        })
                                                        .catch((err) => {
                                                            console.log('errrr ', err);
                                                        });
                                                });
                                        }
                                    });
                            });
                    });
            }
        })
        .catch((err) => {
            res.status(409)
                .json({success: false, msg: err.errors[0].message});
        });
}

export function getUniqueUser(req, res) {
    const condition = {
        where: Sequelize.and(
            {PM_Client_ID: req.authData.PM_Client_ID},
            Sequelize.or(
                {
                    PM_User_MobileNumber: req.body.userId,
                },
                {
                    PM_User_Email_ID: req.body.userId,
                },
            ),
        ),
    };
    RegisterUser.findOne(condition)
        .then((user) => {
            if(user) {
                res.json({
                    status: 200,
                    message: {
                        success: false,
                        data: 'User is already registered in your domain',
                    },
                });
            } else {
                res.json({
                    status: 200,
                    message: {
                        success: true,
                        data: 'User is not registered in your domain',
                    },
                });
            }
        });
}

export function createNewUser(req, res) {
    const add = {
        PM_Client_ID: req.authData.PM_Client_ID,
        PM_Domain: req.authData.PM_Domain,
        PM_User_Status: false,
        PM_User_Active: true,
        PM_FirstLogin: 1,
        PM_User_DateofRegistration: new Date(),
        PM_Domain_ID: req.authData.PM_Domain_ID,
    };
    const userAdd = extend({}, add, req.body);
    const bodyForImage = {
        PM_Client_ID: req.authData.PM_Client_ID,
        imageData: req.body.PM_User_ProfilePic,
        whichImage: 'User_PP',
    };
    console.log('PM_User_Email_ID', userAdd);
    insertInto(userAdd, 'new')
        .then((Obj) => {
            console.log('insertInto', Obj);
            if(Obj.userCount <= Obj.maxUserAllow) {
                if(Obj.filePath) {
                    userAdd.PM_User_ProfilePic = `image-${userAdd.PM_User_MobileNumber}.${Obj.filePath.split('.')
                        .pop()}`;
                } else {
                    userAdd.PM_User_ProfilePic = Obj.filePath;
                }
                const condition = {
                    where: Sequelize.or(
                        Sequelize.and(
                            {
                                PM_Client_ID: req.authData.PM_Client_ID,
                                PM_User_MobileNumber: userAdd.PM_User_MobileNumber,
                            },
                        ),
                        Sequelize.and(
                            {
                                PM_Client_ID: req.authData.PM_Client_ID,
                                PM_User_Email_ID: userAdd.PM_User_Email_ID,
                            },
                        ),
                    ),
                    defaults: userAdd,
                };
                RegisterUser.findOrCreate(condition)
                    .spread((user, created) => {
                        console.log('insertInto', userAdd);
                        console.log('insertIntosssss', user, created);
                        if(created) {
                            const roleList = userAdd.PM_User_Role.split(',');
                            console.log('roleList', roleList);
                            roleList.forEach((roleID, index1) => {
                                console.log('roleID', roleID);
                                const userRoleObj = {};
                                userRoleObj.clientID = req.authData.PM_Client_ID;
                                userRoleObj.userID = user.PM_UserID;
                                userRoleObj.roleID = roleID;
                                userRoleObj.status = 1;
                                UserRole.create(userRoleObj)
                                    .then((s) => {
                                        if(index1 === roleList.length - 1) {
                                            req.body.PM_UserID = user.PM_UserID;
                                            const bodyWelcome = {
                                                clientId: req.authData.PM_Client_ID,
                                                senderId: req.authData.PM_UserID,
                                                senderEmail: req.authData.PM_User_Email_ID,
                                                senderMobile: req.authData.PM_User_MobileNumber,
                                                messageType: 'newUserAdded',
                                                subject: `${req.authData.PM_User_FullName} has invited you to contribute in project`,
                                                priority: 'low',
                                                recipientsAndData: [
                                                    {
                                                        email: userAdd.PM_User_Email_ID,
                                                        mob: userAdd.PM_User_MobileNumber,
                                                        data: `${userAdd.PM_User_FullName}|${req.authData.PM_User_FullName}|${process.env.PROTOCOL}${req.authData.PM_Domain.toLowerCase()}.${process.env.MAIN_DOMAIN}|
                          ${process.env.PROTOCOL}${req.authData.PM_Domain.toLowerCase()}.${process.env.MAIN_DOMAIN}${process.env.FORGOT_CREATE_PASSWORD_LINK}&&email=${userAdd.PM_User_Email_ID}&&fullname=${userAdd.PM_User_FullName}&&mobile=${userAdd.PM_User_MobileNumber}|
                          ${req.authData.PM_Domain.toLowerCase()}.${process.env.MAIN_DOMAIN}`,
//for local                                                        //data: `${userAdd.PM_User_FullName}|${req.authData.PM_User_FullName}|http://localhost:8000|http://localhost:8000${process.env.FORGOT_CREATE_PASSWORD_LINK}email=${userAdd.PM_User_Email_ID}&&fullname=${userAdd.PM_User_FullName}&&mobile=${userAdd.PM_User_MobileNumber}|${req.authData.PM_Domain.toLowerCase()}.${process.env.MAIN_DOMAIN}`
                                                    },
                                                ],
                                            };
                                             saveEmailSmsBacked(bodyWelcome);
                                            createBodyAndSendNotification(req, 'screen', 'firstLoginWelcome')
                                                .then(() => createBodyAndSendNotification(req, 'screen', 'firstLoginTips'))
                                                .then(() => createBodyAndSendNotification(req, 'screen', 'firstLoginStartFirstProject'))
                                                .then(() => {
                                                    console.log('OK');
                                                })
                                                .catch((e) => {
                                                    console.log('e e ', e);
                                                });

                                            if(bodyForImage.imageData) {
                                                bodyForImage.PM_UserID = user.PM_UserID;
                                               /* by  amit return saveImageBackEnd(bodyForImage)
                                                    .then(() => res.send({
                                                            success: true,
                                                            msg: 'User Created Successfully',
                                                        },
                                                    ))
                                                    .catch(() => res.send({
                                                            success: true,
                                                            msg: 'User Created Successfully',
                                                        },
                                                    ));*/
                                            }
                                            return res.send({
                                                    success: true,
                                                    msg: 'User Created Successfully',
                                                },
                                            );
                                        }
                                    });
                            });
                        } else {
                            res.send({
                                    success: false,
                                    msg: 'User already in your domain'
                                },
                            );
                        }
                    })
                    .catch((err) => {
                        console.log(err);
                        res.json({
                            success: false,
                            msg: err.errors[0].message,
                        });
                    });
            } else {
                res.send({success: false, msg: 'Reach Max User Count'});
            }
        })
        .catch((err) => {
        });
}

export function getResourcesOfProjectByName(req, res) {
    let likeCause = '';
    let limitValue;
    let skip;
    if(req.query.q) {
        likeCause = req.query.q;
    }
    const query = {
        where: {
            PM_Client_ID: req.authData.PM_Client_ID,
            PM_User_Active: 1,
            PM_User_FullName: {[Sequelize.Op.like]: `${likeCause}%`}
        },
        order: [
            ['PM_UserID', 'DESC'],
        ],
        attributes: ['PM_UserID', 'PM_User_Email_ID', 'PM_User_MobileNumber', 'PM_User_Role',
            'PM_User_Department', 'PM_User_FullName', 'PM_User_Address', 'PM_User_State', 'PM_User_District',
            'PM_User_Village', 'PM_User_Pincode', 'PM_Designation', 'PM_User_ProfilePic'],
        raw: true,
    };
    if(req.query.limit && req.query.limit !== '' && req.query.skip && req.query.skip !== '') {
        limitValue = parseInt(req.query.limit, 10);
        skip = parseInt(req.query.skip, 10);
        skip *= limitValue;
        query.offset = skip;
        query.limit = limitValue;
    }
    RegisterUser.findAll(query)
        .then((data) => {
            /* getAllUser(results).then((data) => { */
            const resource = [];
            Role.findAll({
                where: {PM_Client_ID: req.authData.PM_Client_ID},
                order: [
                    ['ID', 'DESC'],
                ],
                attributes: ['ID', 'Description'],
                raw: true,
            })
                .then((roles) => {
                    // res.send(data);
                    userResource.findAll({
                        where: {resource_client_id: Number(req.authData.PM_Client_ID), resource_project_id: Number(req.params.projectId), resource_status: 1},
                        order: [
                            ['resource_project_id', 'DESC'],
                        ],
                        attributes: ['resource_id', 'resource_client_id', 'resource_project_id', 'resource_user_id', 'resource_user_role', 'resource_status'],
                        raw: true,
                    })
                        .then((userResources) => {
                            data.forEach((user) => {
                                user.updateResource = false;
                                if(user.PM_User_Role) {
                                    user.PM_User_Role = user.PM_User_Role.split(',');
                                    user.PM_User_Role = user.PM_User_Role.map(key => parseInt(key, 10),
                                    );
                                    user.role = [];
                                    user.PM_User_Role = user.PM_User_Role.map((roleId, index) => {
                                        const userRole = roles.filter(usrRole => roleId === usrRole.ID);
                                        if(userRole) {
                                            user.role[index] = {};
                                            user.role[index] = userRole[0];
                                        }
                                        return userRole[0];
                                    });
                                }
                                userResources.forEach((userRes) => {
                                    if(parseInt(userRes.resource_user_id, 10) === parseInt(user.PM_UserID, 10)) {
                                        user.role = [];
                                        user.updateResource = true;
                                        user.resource_id = userRes.resource_id;
                                        if(userRes.resource_user_role) {
                                            userRes.resource_user_role = userRes.resource_user_role.split(',');
                                            userRes.resource_user_role = userRes.resource_user_role.map(key => parseInt(key, 10),
                                            );
                                            userRes.resource_user_role.forEach((roleId, index) => {
                                                const userRole = roles.filter(usrRole => roleId === usrRole.ID);
                                                if(userRole) {
                                                    user.role[index] = {};
                                                    user.role[index] = userRole[0];
                                                }
                                            });
                                        }
                                        resource.push(user);
                                    }
                                });
                            });
                            if(resource.length > 0) {
                                // res.send({ status: 200, message: { success: true, data: resource } });
                                getImageUrl(res, resource, 0, 'User_PP_Resource');
                            } else {
                                res.send({status: 200, message: {success: false, data: 'No user found'}});
                            }
                        });
                });
            /* }).catch((e) => {
              res.status(409).json({
                message: {
                  success: true,
                  data: 'Role not found',
                },
              });
            }); */
        })
        .catch((e) => {
            res.status(409)
                .json({
                    message: {
                        success: true,
                        data: 'Role not found',
                    },
                });
        });
}

export function updateResources(userId, projectId) {
    const resource = {
        resource_status: 0,
    };
    const condition = {
        where: Sequelize.and(
            {
                resource_user_id: userId,
            },
            {
                resource_project_id: projectId,
            },
        ),

    };
    return userResource.update(resource, condition);
}

function buildClientPromises(requestObject, userID) {
    const promises = requestObject.map((value, key) =>
        Promise.resolve()
            .then(() => updateResources(userID, value)),
    );
    return promises;
}

function updateAll(req, res) {
    return Promise.all(buildClientPromises(req.body.projects, req.body.userId));
}

export function updateUserProject(req, res) {
    updateAll(req, res)
        .then(updates => res.status(200)
            .json({status: 200, data: {success: true, msg: 'User Updated Successfully'}}))
        .catch(err => console.log('hiiiii', err));
}

function sendNotification(req) {
    const body = {
        PM_Client_ID: req.authData.PM_Client_ID,
        PM_Project_ID: req.body.projectId,
    };

    showDetailsProject(body)
        .then((projectDetails) => {
            if(projectDetails.length !== 0) {
                // console.log('projectDetails ', projectDetails);
                if(req.body.msgType === 'resource') {
                    const bodyWelcome = {
                        clientId: req.authData.PM_Client_ID,
                        senderId: req.authData.PM_UserID,
                        senderEmail: req.authData.PM_User_Email_ID,
                        senderMobile: req.authData.PM_User_MobileNumber,
                        messageType: 'assigned',
                        subject: `${req.authData.PM_User_FullName} ${process.env.ASSIGNED_PROJECT}`,
                        priority: 'low',
                        projectId: projectDetails[0].PM_Project_ID,
                        recipientsAndData: [
                            {
                                email: req.body.userEmail,
                                // mob: req.body.userMobile,
                                data: `${req.body.userName}|
                        ${req.authData.PM_User_FullName} ${process.env.ASSIGNED_PROJECT}|
                        ${projectDetails[0].PM_Project_Name}|
                        ${process.env.PROTOCOL}${req.authData.PM_Domain.toLowerCase()}.${process.env.MAIN_DOMAIN}|
                        ${req.authData.PM_Domain.toLowerCase()}.${process.env.MAIN_DOMAIN}|`,
                            },
                        ],
                    };
                    saveEmailSmsBacked(bodyWelcome);
                    // screen notifications
                    for(let i = 0; i < req.body.rolesData.length; i += 1) {
                        const users = [{PM_UserID: req.body.userId}];
                        const bodyScreen = {
                            body: {
                                messageType: 'resource',
                                messageSubject: 'You are now added to a project',
                                isWeb: true,
                                isMob: true,
                                description: '',
                                projectId: projectDetails[0].PM_Project_ID,
                                projectName: projectDetails[0].PM_Project_Name,
                                projectType: projectDetails[0].PM_Project_Type,
                                projectRole: req.body.rolesData[i].Description,
                                recipientIdData: users,
                                roleId: req.body.rolesData[i].ID,
                            },
                            authData: req.authData,
                        };

                        saveScreenBackend(bodyScreen);
                    }
                } else if(req.body.msgType === 'resourceRemove') {
                    const bodyWelcome = {
                        clientId: req.authData.PM_Client_ID,
                        senderId: req.authData.PM_UserID,
                        senderEmail: req.authData.PM_User_Email_ID,
                        senderMobile: req.authData.PM_User_MobileNumber,
                        messageType: 'assigned',
                        subject: `${req.authData.PM_User_FullName} ${process.env.REMOVED_PROJECT}`,
                        priority: 'low',
                        projectId: projectDetails[0].PM_Project_ID,
                        recipientsAndData: [
                            {
                                email: req.body.userEmail,
                                // mob: req.body.userMobile,
                                data: `${req.body.userName}|
                        ${req.authData.PM_User_FullName} ${process.env.REMOVED_PROJECT}|
                        ${projectDetails[0].PM_Project_Name}|
                        ${process.env.PROTOCOL}${req.authData.PM_Domain.toLowerCase()}.${process.env.MAIN_DOMAIN}|
                        ${req.authData.PM_Domain.toLowerCase()}.${process.env.MAIN_DOMAIN}|
                        none|
                        none|
                        none|
                        none`,
                            },
                        ],
                    };
                    saveEmailSmsBacked(bodyWelcome);
                    // screen notifications
                    for(let i = 0; i < req.body.rolesData.length; i += 1) {
                        const users = [{PM_UserID: req.body.userId}];
                        const bodyScreen = {
                            body: {
                                messageType: 'resourceRemove',
                                messageSubject: 'You are now removed from a project',
                                isWeb: true,
                                isMob: true,
                                description: '',
                                projectId: projectDetails[0].PM_Project_ID,
                                projectName: projectDetails[0].PM_Project_Name,
                                projectType: projectDetails[0].PM_Project_Type,
                                projectRole: req.body.rolesData[i].Description,
                                recipientIdData: users,
                                roleId: req.body.rolesData[i].ID,
                            },
                            authData: req.authData,
                        };

                        saveScreenBackend(bodyScreen);
                    }
                }
            }
        })
        .catch((err) => {
            console.log('errrr ', err);
        });
}

export function addResourceNew(req, res) {
    //  console.log('req -------------- ', req.body);
    const body = {
        PM_Client_ID: req.authData.PM_Client_ID,
        PM_Project_ID: req.body.projectId,
    };
    const roleList = req.body.roles.split(',');
    roleList.forEach((roleID, index1) => {
        const resource = {
            resource_client_id: req.authData.PM_Client_ID,
            resource_user_id: req.body.userId,
            resource_project_id: req.body.projectId,
            resource_user_role: roleID,
            resource_status: 1,
        };
        userResource.findOrCreate({
            where: {resource_client_id: req.authData.PM_Client_ID, resource_user_id: req.body.userId, resource_project_id: req.body.projectId, resource_user_role: roleID},
            defaults: resource
        })
            .spread((user, created) => {
                if(!created) {
                    userResource.update(resource,
                        {where: {resource_client_id: req.authData.PM_Client_ID, resource_user_id: req.body.userId, resource_project_id: req.body.projectId, resource_user_role: roleID}})
                        .then((results) => {
                            if(results[0] === 1) {
                                resourceRole.update({
                                    resource_role_resource_id: user.resource_id,
                                    resource_role_role_id: roleID,
                                    resource_role_status: true
                                }, {where: {resource_role_resource_id: user.resource_id, resource_role_role_id: roleID}})
                                    .then(() => {
                                        if(index1 === roleList.length - 1) {
                                            res.status(200)
                                                .json({status: 200, data: {success: true, msg: 'User added to resource successfully'}});
                                            req.body.msgType = 'resource';
                                            sendNotification(req);
                                        }
                                    });
                            } else {
                                res.status(200)
                                    .json({status: 200, data: {success: true, msg: 'User Cant be added to resource'}});
                            }
                        })
                        .catch((err) => {
                            res.status(409)
                                .json({status: 200, data: {success: false, msg: err}});
                        });
                } else {
                    resourceRole.create({resource_role_resource_id: user.resource_id, resource_role_role_id: roleID, resource_role_status: true})
                        .then(() => {
                            if(index1 === roleList.length - 1) {
                                res.send({status: 200, data: {success: true, msg: 'User added to resource successfully'}});
                                req.body.msgType = 'resource';
                                sendNotification(req);
                            }
                        });
                }
            });
    });
}


export function removeResourceNew(req, res) {
    const clientID = req.authData.PM_Client_ID;
    const projectID = req.body.projectId;
    let resourceId = req.body.resourceId;

    const resource = {
        resource_status: 0,
    };
    const body = {
        PM_Client_ID: req.authData.PM_Client_ID,
        PM_Project_ID: req.body.projectId,
    };
    userResource.update(resource,
        {where: {resource_client_id: req.authData.PM_Client_ID, resource_project_id: req.body.projectId, resource_user_id: req.body.userId}})
        .then((results) => {
            if(results[0] > 0) {
                // userResource.findOne({ where: { resource_client_id: req.authData.PM_Client_ID, resource_project_id: req.body.projectId, resource_user_id: req.body.userId } })
                //   .then((result) => {
                resourceId = req.body.userId;

                Task.findAll({
                    where: {
                        PM_Client_ID: clientID,
                        PM_Project_ID: projectID
                    }
                })
                    .then((task) => {
                        for(let i = 0; i < task.length; i += 1) {
                            const obj = {};

                            obj.assignee = task[i].PM_Task_Assignee;
                            if(obj.assignee === resourceId) {
                                obj.assignee = null;
                            }
                            obj.auditor = task[i].PM_Task_Auditor;
                            if(obj.auditor === resourceId) {
                                obj.auditor = null;
                            }
                            obj.approver = task[i].PM_Task_Approver;
                            if(obj.approver === resourceId) {
                                obj.approver = null;
                            }

                            Task.update({
                                PM_Task_Assignee: obj.assignee,
                                PM_Task_Auditor: obj.auditor,
                                PM_Task_Approver: obj.approver,
                            }, {
                                where: {
                                    PM_Client_ID: clientID,
                                    PM_Project_ID: projectID,
                                    PM_Task_ID: task[i].PM_Task_ID,
                                }
                            });
                        }
                    })
                    .then(() => {
                        Milestone.findAll({
                            where: {
                                PM_Client_ID: clientID,
                                PM_Project_ID: projectID
                            }
                        })
                            .then((mile) => {
                                for(let i = 0; i < mile.length; i += 1) {
                                    const obj = {};

                                    obj.assignee = mile[i].PM_Milestone_Assignee;
                                    if(obj.assignee === resourceId) {
                                        obj.assignee = null;
                                    }

                                    obj.auditor = mile[i].PM_Milestone_Auditor;
                                    if(obj.auditor === resourceId) {
                                        obj.auditor = null;
                                    }

                                    obj.approver = mile[i].PM_Milestone_Approver;
                                    if(obj.approver === resourceId) {
                                        obj.approver = null;
                                    }

                                    Milestone.update({
                                        PM_Milestone_Assignee: obj.assignee,
                                        PM_Milestone_Auditor: obj.auditor,
                                        PM_Milestone_Approver: obj.approver,
                                    }, {
                                        where: {
                                            PM_Client_ID: clientID,
                                            PM_Project_ID: projectID,
                                            PM_Milestone_ID: mile[i].PM_Milestone_ID,
                                        }
                                    });
                                }
                            });
                    })
                    .then(() => {
                        SubProject.findAll({
                            where: {
                                PM_Client_ID: clientID,
                                PM_Project_ID: projectID
                            }
                        })
                            .then((subproject) => {
                                for(let i = 0; i < subproject.length; i += 1) {
                                    const obj = {};

                                    obj.assignee = subproject[i].PM_SubProject_Assignee;
                                    if(obj.assignee === resourceId) {
                                        obj.assignee = null;
                                    }

                                    obj.auditor = subproject[i].PM_SubProject_Auditor;
                                    if(obj.auditor === resourceId) {
                                        obj.auditor = null;
                                    }

                                    obj.approver = subproject[i].PM_SubProject_Approver;
                                    if(obj.approver === resourceId) {
                                        obj.approver = null;
                                    }

                                    SubProject.update({
                                        PM_SubProject_Assignee: obj.assignee,
                                        PM_SubProject_Auditor: obj.auditor,
                                        PM_SubProject_Approver: obj.approver,
                                    }, {
                                        where: {
                                            PM_Client_ID: clientID,
                                            PM_Project_ID: projectID,
                                            PM_SubProject_ID: subproject[i].PM_SubProject_ID,
                                        }
                                    });
                                }
                            });
                    })
                    .then(() => {
                        Audit.findAll({
                            where: {
                                PM_Client_ID: clientID,
                                PM_Project_ID: projectID
                            }
                        })
                            .then((audit) => {
                                for(let i = 0; i < audit.length; i += 1) {
                                    const obj = {};

                                    obj.PM_Auditor_ID = audit[i].PM_Auditor_ID;
                                    if(obj.PM_Auditor_ID === resourceId) {
                                        obj.PM_Auditor_ID = null;
                                    }

                                    Audit.update({
                                        PM_Auditor_ID: obj.PM_Auditor_ID,
                                    }, {
                                        where: {
                                            PM_Client_ID: clientID,
                                            PM_Project_ID: projectID,
                                            Audit_Status: null,
                                        }
                                    });
                                }
                            });
                    })
                    .then(() => {
                        Approve.findAll({
                            where: {
                                PM_Client_ID: clientID,
                                PM_Project_ID: projectID
                            }
                        })
                            .then((approve) => {
                                if(approve.length < 1) {
                                    res.status(200)
                                        .json({status: 200, data: {success: true, msg: 'User removed from resource Successfully'}});
                                    req.body.msgType = 'resourceRemove';
                                    sendNotification(req);
                                }
                                for(let i = 0; i < approve.length; i += 1) {
                                    const obj = {};

                                    obj.Approver_UserID = approve[i].Approver_UserID;
                                    if(obj.Approver_UserID === resourceId) {
                                        obj.Approver_UserID = null;
                                    }

                                    Approve.update({
                                        Approver_UserID: obj.Approver_UserID,
                                    }, {
                                        where: {
                                            PM_Client_ID: clientID,
                                            PM_Project_ID: projectID,
                                            PM_Approve_Status: null,
                                        }
                                    })
                                        .then(() => {
                                            res.status(200)
                                                .json({status: 200, data: {success: true, msg: 'User removed from resource Successfully'}});
                                            req.body.msgType = 'resourceRemove';
                                            sendNotification(req);
                                        });
                                }
                            });
                    });
                // });
            }
        })
        .catch((err) => {
            res.status(409)
                .json({success: false, msg: err.errors[0].message});
        });
}


export function getResources1(req, res) {
    let likeCause = '';
    let limitValue;
    let skip;
    if(req.query.q) {
        likeCause = req.query.q;
    }
    const query = {
        where: {
            PM_Client_ID: req.authData.PM_Client_ID,
            PM_User_Active: 1,
            PM_User_FullName: {[Sequelize.Op.like]: `%${likeCause}%`}
        },
        group: ['PM_UserID'],
        order: [
            ['PM_UserID', 'DESC'],
        ],
        attributes: ['PM_UserID', 'PM_User_Email_ID', 'PM_User_MobileNumber', 'PM_User_Role',
            'PM_User_Department', 'PM_User_FullName', 'PM_User_Address', 'PM_User_State', 'PM_User_District',
            'PM_User_Village', 'PM_User_Pincode', 'PM_Designation', 'PM_User_ProfilePic'],
        raw: true,
        include: [{
            model: UserRole,
            as: 'User',
            where: {clientID: req.authData.PM_Client_ID, status: 1},
            attributes: ['roleID'],
            required: false,
            include: [{
                model: Role,
                as: 'UserRole1',
                where: {PM_Client_ID: req.authData.PM_Client_ID, Status: 1},
                attributes: ['ID', 'Description'],
                required: false,
            }],
        }],
    };
    if(req.query.limit && req.query.limit !== '' && req.query.skip && req.query.skip !== '') {
        limitValue = parseInt(req.query.limit, 10);
        skip = parseInt(req.query.skip, 10);
        skip *= limitValue;
        query.offset = skip;
        query.limit = limitValue;
    }
    RegisterUser.findAll(query)
        .then((results) => {
            getAllUser(results)
                .then((data) => {
                    const userList = [];
                    data.forEach((item) => {
                        const newUser = {};
                        const newRole = {};
                        // if (userList.length > 0) {
                        const index = userList.findIndex(u => u.PM_UserID === item.PM_UserID);
                        if(index >= 0) { // user is already in userList just push role of that user in Role
                            newRole.ID = item['User.roleID'];
                            newRole.Description = item['User.UserRole1.Description'];
                            userList[index].PM_User_Role.push(newRole);
                            // userList[index].role.push(newRole);
                        } else {
                            newUser.PM_UserID = item.PM_UserID;
                            newUser.PM_User_Email_ID = item.PM_User_Email_ID;
                            newUser.PM_User_MobileNumber = item.PM_User_MobileNumber;
                            newUser.PM_User_Department = item.PM_User_Department;
                            newUser.PM_User_FullName = item.PM_User_FullName;
                            newUser.PM_Designation = item.PM_Designation;
                            newUser.PM_User_ProfilePic = item.PM_User_ProfilePic;
                            newUser.PM_User_Role = [];
                            // newUser.role = [];
                            newRole.ID = item['User.roleID'];
                            newRole.Description = item['User.UserRole1.Description'];
                            newUser.PM_User_Role.push(newRole);
                            // newUser.role.push(newRole);
                            userList.push(newUser);
                        }
                        // }
                    });
                    userList.forEach((item) => {
                        item.PM_User_Role = item.PM_User_Role.map(map => map.ID);
                        item.PM_User_Role = item.PM_User_Role.toString();
                    });
                    data = userList;
                    // res.send({ status: 200, message: { success: true, data: userList } });
                    Role.findAll({
                        where: {PM_Client_ID: req.authData.PM_Client_ID},
                        order: [
                            ['ID', 'DESC'],
                        ],
                        attributes: ['ID', 'Description'],
                        raw: true,
                    })
                        .then((roles) => {
                            // res.send(data);
                            userResource.findAll({
                                where: {resource_client_id: Number(req.authData.PM_Client_ID), resource_project_id: Number(req.params.projectId), resource_status: 1},
                                order: [
                                    ['resource_project_id', 'DESC'],
                                ],
                                attributes: ['resource_id', 'resource_client_id', 'resource_project_id', 'resource_user_id', 'resource_user_role', 'resource_status'],
                                raw: true,
                            })
                                .then((userResources) => {
                                    data.forEach((user) => {
                                        user.updateResource = false;
                                        if(user.PM_User_Role) {
                                            user.PM_User_Role = user.PM_User_Role.split(',');
                                            user.PM_User_Role = user.PM_User_Role.map(key => parseInt(key, 10),
                                            );
                                            user.role = [];
                                            user.PM_User_Role = user.PM_User_Role.map((roleId, index) => {
                                                const userRole = roles.filter(usrRole => roleId === usrRole.ID);
                                                if(userRole) {
                                                    user.role[index] = {};
                                                    user.role[index] = userRole[0];
                                                }
                                                return userRole[0];
                                            });
                                        }

                                        userResources.forEach((userRes) => {
                                            if(parseInt(userRes.resource_user_id, 10) === parseInt(user.PM_UserID, 10)) {
                                                user.role = [];
                                                user.updateResource = true;
                                                user.resource_id = userRes.resource_id;
                                                if(userRes.resource_user_role) {
                                                    userRes.resource_user_role = userRes.resource_user_role.split(',');
                                                    userRes.resource_user_role = userRes.resource_user_role.map(key => parseInt(key, 10),
                                                    );
                                                    userRes.resource_user_role.forEach((roleId, index) => {
                                                        const userRole = roles.filter(usrRole => roleId === usrRole.ID);
                                                        if(userRole) {
                                                            // user.role[index] = {};
                                                            // user.role[index] = userRole[0];
                                                            user.role.push(userRole[0]);
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                    });
                                    if(data.length > 0) {
                                        res.send({status: 200, message: {success: true, data}});
                                    } else {
                                        res.send({status: 200, message: {success: false, data: 'No user found'}});
                                    }
                                });
                        });
                })
                .catch((e) => {
                    res.status(409)
                        .json({
                            message: {
                                success: true,
                                data: 'Role not found',
                            },
                        });
                });
        })
        .catch((e) => {
            res.status(409)
                .json({
                    message: {
                        success: true,
                        data: 'Role not found',
                    },
                });
        });
}


export function getOnlyResourcesNew(req, res) {
    let likeCause = '';
    let limitValue;
    let skip;
    if(req.query.q) {
        likeCause = req.query.q;
    }

    const query = {
        where: {
            PM_Client_ID: req.authData.PM_Client_ID,
            PM_User_Active: 1,
            PM_User_FullName: {[Sequelize.Op.like]: `%${likeCause}%`}
        },
        order: [
            ['PM_UserID', 'DESC'],
        ],
        attributes: ['PM_UserID', 'PM_User_Email_ID', 'PM_User_MobileNumber', 'PM_User_Role',
            'PM_User_Department', 'PM_User_FullName', 'PM_User_Address', 'PM_User_State', 'PM_User_District',
            'PM_User_Village', 'PM_User_Pincode', 'PM_Designation', 'PM_User_ProfilePic'],
        raw: true,
        include: [{
            model: UserRole,
            as: 'User',
            where: {clientID: req.authData.PM_Client_ID, status: 1},
            attributes: ['roleID'],
            required: false,
            include: [{
                model: Role,
                as: 'UserRole1',
                where: {PM_Client_ID: req.authData.PM_Client_ID, Status: 1},
                attributes: ['ID', 'Description'],
                required: false,
            }],
        }],
    };
    RegisterUser.findAll(query)
        .then((data) => {
            /*  getAllUser(results).then((data) => { */
            const userList = [];
            data.forEach((item) => {
                const newUser = {};
                const newRole = {};
                // if (userList.length > 0) {
                const index = userList.findIndex(u => u.PM_UserID === item.PM_UserID);
                if(index >= 0) { // user is already in userList just push role of that user in Role
                    newRole.ID = item['User.roleID'];
                    newRole.Description = item['User.UserRole1.Description'];
                    userList[index].PM_User_Role.push(newRole);
                    // userList[index].role.push(newRole);
                } else {
                    newUser.PM_UserID = item.PM_UserID;
                    newUser.PM_User_Email_ID = item.PM_User_Email_ID;
                    newUser.PM_User_MobileNumber = item.PM_User_MobileNumber;
                    newUser.PM_User_Department = item.PM_User_Department;
                    newUser.PM_User_FullName = item.PM_User_FullName;
                    newUser.PM_Designation = item.PM_Designation;
                    newUser.PM_User_ProfilePic = item.PM_User_ProfilePic;
                    newUser.PM_User_Role = [];
                    // newUser.role = [];
                    newRole.ID = item['User.roleID'];
                    newRole.Description = item['User.UserRole1.Description'];
                    newUser.PM_User_Role.push(newRole);
                    // newUser.role.push(newRole);
                    userList.push(newUser);
                }
                // }
            });

            userList.forEach((item) => {
                item.PM_User_Role = item.PM_User_Role.map(map => map.ID);
                item.PM_User_Role = item.PM_User_Role.toString();
            });
            data = userList;
            const resourceData = [];
            Role.findAll({
                where: {PM_Client_ID: req.authData.PM_Client_ID},
                order: [
                    ['ID', 'DESC'],
                ],
                attributes: ['ID', 'Description'],
                raw: true,
            })
                .then((roles) => {
                    // res.send(data);
                    userResource.findAll({
                        where: {resource_client_id: req.authData.PM_Client_ID, resource_project_id: Number(req.params.projectId), resource_status: 1},
                        order: [
                            ['resource_project_id', 'DESC'],
                        ],
                        attributes: ['resource_id', 'resource_client_id', 'resource_project_id', 'resource_user_id', 'resource_user_role', 'resource_status'],
                        raw: true,
                    })
                        .then((userResources) => {
                            if(userResources) {
                                data.forEach((user) => {
                                    user.updateResource = false;
                                    if(user.PM_User_Role) {
                                        user.PM_User_Role = user.PM_User_Role.split(',');
                                        user.PM_User_Role = user.PM_User_Role.map(key => parseInt(key, 10));
                                        user.role = [];
                                        user.PM_User_Role = user.PM_User_Role.map((roleId, index) => {
                                            const userRole = roles.filter(usrRole => roleId === usrRole.ID);
                                            if(userRole) {
                                                user.role[index] = {};
                                                user.role[index] = userRole[0];
                                            }
                                            return userRole[0];
                                        });
                                    }
                                    userResources.forEach((userRes) => {
                                        if(parseInt(userRes.resource_user_id, 10) === parseInt(user.PM_UserID, 10)) {
                                            // console.log('resource_user_id', userRes);
                                            user.role = [];
                                            user.resource_id = userRes.resource_id;
                                            user.updateResource = true;
                                            if(userRes.resource_user_role) {
                                                userRes.resource_user_role = userRes.resource_user_role.split(',');
                                                userRes.resource_user_role = userRes.resource_user_role.map(key => parseInt(key, 10));
                                                userRes.resource_user_role.forEach((roleId, index) => {
                                                    const userRole = roles.filter(usrRole => roleId === usrRole.ID);
                                                    if(userRole) {
                                                        user.role[index] = {};
                                                        user.role[index] = userRole[0];
                                                    }
                                                });
                                            }

                                            const resourceIndex = resourceData.findIndex(resr => resr.PM_UserID === userRes.resource_user_id);
                                            if(resourceIndex !== -1) {
                                                user.role.forEach((roleId, index) => {
                                                    const resRoleIndex = resourceData[resourceIndex].role.findIndex(usrRole => roleId.ID === usrRole.ID);
                                                    if(resRoleIndex === -1) {
                                                        resourceData[resourceIndex].role.push(roleId);
                                                    }
                                                });
                                            } else {
                                                resourceData.push(JSON.parse(JSON.stringify(user)));
                                            }
                                        }
                                    });
                                });
                            }
                            if(resourceData.length > 0) {
                                // res.send({ status: 200, message: { success: true, data: resourceData } });
                                getImageUrl(res, resourceData, 0, 'User_PP_Resource');
                            } else {
                                res.send({status: 200, message: {success: false, data: 'Add Your Resources'}});
                            }
                            // res.send(resourceData);
                        });
                });
            // });
        });
}


export function updateResourceNew(req, res) {
    const updateRoles = req.body.roles;
    // const resource = {
    //   resource_user_role: req.body.roles,
    // };
    // const resource1 = {
    //   resource_status: 1,
    // };

    updateRoles.forEach((roles, index) => {
        if(roles.isAdded === true) {
            const resource = {
                resource_client_id: req.authData.PM_Client_ID,
                resource_user_id: req.body.userId,
                resource_project_id: req.body.projectId,
                resource_user_role: roles.roleID,
                resource_status: 1,
            };
            userResource.findOrCreate({
                where: {
                    resource_client_id: req.authData.PM_Client_ID,
                    resource_user_id: req.body.userId,
                    resource_project_id: req.body.projectId,
                    resource_user_role: roles.roleID
                }, defaults: resource
            })
                .spread((user, created) => {
                    if(!created) {
                        userResource.update(resource,
                            {where: {resource_client_id: req.authData.PM_Client_ID, resource_user_id: req.body.userId, resource_project_id: req.body.projectId, resource_user_role: roles.roleID}})
                            .then((results) => {
                                if(results[0] === 1) {
                                    resourceRole.findOrCreate({
                                        where: {resource_role_resource_id: user.resource_id, resource_role_role_id: roles.roleID},
                                        defaults: {resource_role_resource_id: user.resource_id, resource_role_role_id: roles.roleID, resource_role_status: true}
                                    })
                                        .then((resRole, resRoleCreated) => {
                                            if(resRoleCreated) {
                                                if(updateRoles.length - 1 === index) {
                                                    res.status(200)
                                                        .json({status: 200, data: {success: true, msg: 'User Updated Successfully'}});
                                                }
                                            } else {
                                                resourceRole.update({
                                                    resource_role_resource_id: user.resource_id,
                                                    resource_role_role_id: roles.roleID,
                                                    resource_role_status: true
                                                }, {where: {resource_role_resource_id: user.resource_id, resource_role_role_id: roles.roleID}})
                                                    .then(() => {
                                                        if(updateRoles.length - 1 === index) {
                                                            res.status(200)
                                                                .json({status: 200, data: {success: true, msg: 'User Updated Successfully'}});
                                                        }
                                                    });
                                            }
                                        });
                                } else {
                                    res.status(200)
                                        .json({status: 200, data: {success: true, msg: 'User Cant be update'}});
                                }
                            })
                            .catch((err) => {
                                res.status(409)
                                    .json({status: 200, data: {success: false, msg: err.errors[0].message}});
                            });
                    } else {
                        resourceRole.create({resource_role_resource_id: user.resource_id, resource_role_role_id: roles.roleID, resource_role_status: true})
                            .then(() => {
                                if(updateRoles.length - 1 === index) {
                                    res.status(200)
                                        .json({status: 200, data: {success: true, msg: 'User Updated Successfully'}});
                                }
                            });
                    }
                });
        } else {
            const resource = {
                resource_client_id: req.authData.PM_Client_ID,
                resource_user_id: req.body.userId,
                resource_project_id: req.body.projectId,
                resource_user_role: roles.roleID,
                resource_status: 0,
            };

            // roles.roleID
            userResource.findOne({where: {resource_client_id: req.authData.PM_Client_ID, resource_user_id: req.body.userId, resource_project_id: req.body.projectId, resource_user_role: roles.roleID}})
                .then((userRes) => {
                    userResource.update(resource,
                        {where: {resource_client_id: req.authData.PM_Client_ID, resource_user_id: req.body.userId, resource_project_id: req.body.projectId, resource_user_role: roles.roleID}})
                        .then((results) => {
                            if(results[0] === 1) {
                                resourceRole.update({resource_role_status: 0}, {where: {resource_role_resource_id: userRes.resource_id, resource_role_role_id: roles.roleID}})
                                    .then(() => {
                                        if(updateRoles.length - 1 === index) {
                                            res.status(200)
                                                .json({status: 200, data: {success: true, msg: 'User Updated Successfully'}});
                                        }
                                    });
                            } else {
                                res.status(200)
                                    .json({status: 200, data: {success: true, msg: 'User Cant be update'}});
                            }
                        })
                        .catch((err) => {
                            res.status(409)
                                .json({status: 200, data: {success: false, msg: err.errors[0].message}});
                        });
                });
        }
    });

    // userResource.findAll({ where: { resource_client_id: req.authData.PM_Client_ID, resource_user_id: req.body.userId, resource_project_id: req.body.projectId } })
    //   .then((users) => {
    //     console.log('found', users[0].resource_user_id);
    //
    //     const UserRoles = users.map((user, index) => user.resource_user_role);
    //     const removedRoles = findMissing(UserRoles, roles);
    //     console.log('UserRoles', UserRoles);
    //     console.log('roles', roles);
    //   });


    // userResource.update(resource,
    //   { where: { resource_client_id: req.authData.PM_Client_ID, resource_user_id: req.body.userId } }).then((results) => {
    //   if (results[0] === 1) {
    //     res.status(200).json({ status: 200, data: { success: true, msg: 'User Updated Successfully' } });
    //   } else {
    //     res.status(200).json({ status: 200, data: { success: true, msg: 'User Cant be update' } });
    //   }
    // }).catch((err) => {
    //   res.status(409).json({ status: 200, data: { success: false, msg: err.errors[0].message } });
    // });
}


// Function for finding elements
// which are there in arr1[] but not
// in arr2[].
function findMissing(arr1, arr2) {
    const arr = [];
    for(let i = 0; i < arr1.length; i++) {
        let j;
        for(j = 0; j < arr2.length; j++) {
            if(arr1[i] === arr2[j]) {
                break;
            }
        }
        if(j === arr2.length) {
            arr.push(arr1[i]);
        }
    }
    return arr;
}


export function getManagerUsers(req, res) {
    return RegisterUser.findAll({
        where: {
            PM_User_Active: 1,
            PM_Client_ID: req.query.c,
        },
        attributes:
            ['PM_UserID', 'PM_User_Email_ID', 'PM_User_MobileNumber', 'PM_User_FullName'],
        include: [
            {
                model: userResource,
                as: 'ResourceID',
                attributes: ['resource_user_role'],
                where: {resource_client_id: req.query.c, resource_project_id: req.query.p, resource_status: 1},
            }],
        raw: true,
    })
        .then((result) => {
            if(result.length !== 0) {
                const roles = [];
                for(let i = 0; i < result.length; i += 1) {
                    if(!roles.includes(result[i]['ResourceID.resource_user_role'])) {
                        roles.push(result[i]['ResourceID.resource_user_role']);
                    }
                    if(i === result.length - 1) {
                        return RolePermission.findAll({
                            where: {
                                clientID: req.query.c,
                                roleID: {[Sequelize.Op.in]: roles},
                                permissionID: 15,
                                status: 1,
                            },
                        })
                            .then((permission) => {
                                if(permission.length !== 0) {
                                    const permissionRole = [];
                                    for(let j = 0; j <= permission.length; j += 1) {
                                        if(!permissionRole.includes(permission[j].roleID)) {
                                            permissionRole.push(permission[j].roleID);
                                        }
                                        if(j === permission.length - 1) {
                                            let managerUsers = [];
                                            // return res.json([ {permissionRole}, {result} ]);
                                            for(let k = 0; k < result.length; k += 1) {
                                                for(let l = 0; l < permissionRole.length; l += 1) {
                                                    if(parseInt(result[k]['ResourceID.resource_user_role'], 10) === permissionRole[l]) {
                                                        managerUsers.push(result[k]);
                                                    }
                                                }
                                                if(k === result.length - 1) {
                                                    managerUsers = _.uniqBy(managerUsers, 'PM_UserID');
                                                    return res.json(managerUsers);
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    return res.json([]);
                                }
                            })
                            .catch(() => res.json([]));
                    }
                }
                // res.json(roles);
            }
            return res.json([]);
        })
        .catch(() => res.json([]));
}

export function getManagerUsersBacked(clientId, projectId) {
    return new Promise(resolve => RegisterUser.findAll({
        where: {
            PM_User_Active: 1,
            PM_Client_ID: clientId,
        },
        attributes:
            ['PM_UserID', 'PM_User_Email_ID', 'PM_User_MobileNumber', 'PM_User_FullName'],
        include: [
            {
                model: userResource,
                as: 'ResourceID',
                attributes: ['resource_user_role'],
                where: {resource_client_id: clientId, resource_project_id: projectId, resource_status: 1},
            }],
        raw: true,
    })
        .then((result) => {
            if(result.length !== 0) {
                const roles = [];
                for(let i = 0; i < result.length; i += 1) {
                    if(!roles.includes(result[i]['ResourceID.resource_user_role'])) {
                        roles.push(result[i]['ResourceID.resource_user_role']);
                    }
                    if(i === result.length - 1) {
                        RolePermission.findAll({
                            where: {
                                clientID: clientId,
                                roleID: {[Sequelize.Op.in]: roles},
                                permissionID: 15,
                                status: 1,
                            },
                        })
                            .then((permission) => {
                                if(permission.length !== 0) {
                                    const permissionRole = [];
                                    for(let j = 0; j <= permission.length; j += 1) {
                                        if(!permissionRole.includes(permission[j].roleID)) {
                                            permissionRole.push(permission[j].roleID);
                                        }
                                        if(j === permission.length - 1) {
                                            let managerUsers = [];
                                            // return res.json([ {permissionRole}, {result} ]);
                                            for(let k = 0; k < result.length; k += 1) {
                                                for(let l = 0; l < permissionRole.length; l += 1) {
                                                    if(parseInt(result[k]['ResourceID.resource_user_role'], 10) === permissionRole[l]) {
                                                        managerUsers.push(result[k]);
                                                    }
                                                }
                                                if(k === result.length - 1) {
                                                    managerUsers = _.uniqBy(managerUsers, 'PM_UserID');
                                                    resolve(managerUsers);
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    resolve([]);
                                }
                            })
                            .catch(() => resolve([]));
                    }
                }
                // res.json(roles);
            } else {
                resolve([]);
            }
        })
        .catch(() => resolve([])));
}

export function resourceByRole(req, res) {
    const projectId = parseInt(req.params.projectId, 10);
    const permissionID = parseInt(req.params.permissionID, 10);
    if(isNaN(projectId) || isNaN(permissionID)) {
        return res.json([{}]);
    }
    let likeCause = '';
    if(req.query.q) {
        likeCause = req.query.q;
    }

    RolePermission.findAll({
        where: {
            clientID: req.authData.PM_Client_ID,
            permissionID: req.params.permissionID,
            status: 1,
        },
        attributes: ['roleID'],
        include: [
            {
                model: Role,
                as: 'Role3',
                where: {
                    PM_Client_ID: req.authData.PM_Client_ID,
                    Status: 1,
                },
                required: false,
                include: [
                    {
                        model: resourceRole,
                        as: 'resourceRole3',
                        where: {
                            resource_role_status: 1,
                        },
                        required: false,
                        include: [
                            {
                                model: userResource,
                                as: 'userResource3',
                                required: false,
                                where: {
                                    resource_status: 1,
                                    resource_project_id: req.params.projectId,
                                },
                                include: [
                                    {
                                        model: RegisterUser,
                                        as: 'RegisterUserResource',
                                        where: {
                                            PM_User_FullName: {[Sequelize.Op.like]: `%${likeCause}%`},
                                        },
                                        attributes: ['PM_UserID', 'PM_User_Email_ID', 'PM_User_MobileNumber', 'PM_User_Department', 'PM_User_FullName', 'PM_Designation', 'PM_User_ProfilePic'],
                                        required: false,
                                        include: [{
                                            model: UserRole,
                                            as: 'User',
                                            where: {clientID: req.authData.PM_Client_ID, status: 1},
                                            attributes: ['roleID'],
                                            required: false,
                                            include: [{
                                                model: Role,
                                                as: 'UserRole1',
                                                where: {PM_Client_ID: req.authData.PM_Client_ID, Status: 1},
                                                attributes: ['ID', 'Description'],
                                                required: false,
                                            }],
                                        }],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    })
        .then((roles) => {
            roles = JSON.stringify(roles);
            roles = JSON.parse(roles);
            const Users = [];
            roles.forEach((user, index) => {
                if(user.Role3 && user.Role3.resourceRole3) {
                    user.Role3.resourceRole3.forEach((resourceRole3) => {
                        if(resourceRole3.userResource3 && resourceRole3.userResource3.RegisterUserResource && resourceRole3.userResource3.RegisterUserResource.User) {
                            resourceRole3.userResource3.RegisterUserResource.PM_User_Role = resourceRole3.userResource3.RegisterUserResource.User.map(userRole => userRole.UserRole1);
                            resourceRole3.userResource3.RegisterUserResource.role = [];
                            Users.push(resourceRole3.userResource3.RegisterUserResource);
                        }
                    });
                }
            });
            const UniqueUser = [];
            const map = new Map();
            for(const item of Users) {
                if(!map.has(item.PM_UserID)) {
                    map.set(item.PM_UserID, true);
                    UniqueUser.push(item);
                }
            }
            UniqueUser.forEach((uniqueUser) => {
                roles.forEach((user) => {
                    if(user.Role3 && user.Role3.resourceRole3) {
                        user.Role3.resourceRole3.forEach((resourceRole3) => {
                            if(resourceRole3.userResource3 && resourceRole3.userResource3.RegisterUserResource && resourceRole3.userResource3.RegisterUserResource.PM_User_Role) {
                                if(Number(resourceRole3.userResource3.RegisterUserResource.PM_UserID) === Number(uniqueUser.PM_UserID)) {
                                    for(let i = 0; i < uniqueUser.PM_User_Role.length; i += 1) {
                                        if(Number(resourceRole3.userResource3.resource_user_role) === Number(uniqueUser.PM_User_Role[i].ID)) {
                                            uniqueUser.role.push(uniqueUser.PM_User_Role[i]);
                                        }
                                    }
                                }
                            }
                        });
                    }
                });
            });
            if(UniqueUser.length > 0) {
                getImageUrl(res, UniqueUser, 0, 'User_PP_Resource');
            } else {
                res.send({status: 200, message: {success: false, data: 'No Resources'}});
            }
            // res.send({ status: 200, message: { success: true, data: UniqueUser } });
        });
}
