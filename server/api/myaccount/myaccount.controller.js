/* eslint-disable max-len,consistent-return,no-shadow,import/prefer-default-export,no-unused-vars */

import crypto from 'crypto';
import {Register, RegisterUser, LoginSession, userResource, Sequelize} from '../../config/sqldb';
import {RegisterClient, Subscription, Order, ReportIssue} from '../../config/sqldb/portal.db';

const redisClient = require('../../config/redis').redisClient;


function getActivePlan(req, res) {
    return new Promise((resolve) => {
        RegisterClient.findOne({where: {PM_Client_ID: Number(req.authData.PM_Client_ID)}})
            .then((client) => {
                // console.log('client.PM_Plan_Id', req.authData);
                Subscription.findOne({where: {PLAN_ID: Number(client.PM_Plan_Id)}})
                    .then((plan) => {
                        resolve(plan);
                    })
                    .catch((err) => {
                        resolve('aa');
                    });
            })
            .catch((err) => {
                resolve('aa');
            });
    });
}

function getActiveUsers(req, res) {
    return new Promise((resolve) => {
        RegisterUser.findAll({where: {PM_Client_ID: Number(req.authData.PM_Client_ID), PM_User_Status: 1, PM_User_Active: 1}})
            .then((activeUsers) => {
                resolve(activeUsers);
            })
            .catch((err) => {
                resolve('aa');
            });
    });
}

function getLoggedInUsers(req, res) {
    return new Promise((resolve) => {
        LoginSession.findAll({where: {ClientID: Number(req.authData.PM_Client_ID), LoginStatus: 1}})
            .then((loginUsers) => {
                // console.log('loggedIn users', loginUsers);
                resolve(loginUsers);
            })
            .catch((err) => {
                resolve('aa');
            });
    });
}

function getOrderDetails(planId, domainId) {
    // console.log('order info', planId, domainId);
    return new Promise((resolve) => {
        Order.findAll({
            where: {
                ORDER_PLAN_ID: planId,
                ORDER_CLIENT_ID: domainId,
            },
        })
            .then((orders) => {
                // console.log('orders[orders.length - 1].ORDER_ID', orders);
                if(orders.length > 0) {
                    for(let i = 0; i < orders.length; i += 1) {
                        if(orders[i].ORDER_STATE === 3 || orders[i].ORDER_STATE === 4) {
                            console.log('order info', orders[i]);
                            return resolve(orders[i]);
                        }
                    }
                    return resolve(null);
                }
                resolve(null);
            })
            .catch((err) => {
                console.log(err);
            });
    });
}

function userDetail(req, res) {
    return new Promise((resolve, reject) => {
        const condition = {
            where: Sequelize.and(
                {PM_Domain_ID: req.authData.PM_Domain_ID, PM_User_Active: 1},
                Sequelize.or(
                    {
                        PM_User_MobileNumber: req.authData.PM_User_MobileNumber,
                    },
                    {
                        PM_User_Email_ID: req.authData.PM_User_Email_ID,
                    },
                ),
            ),
        };
        RegisterUser.findOne(condition)
            .then((userObj) => {
                if(userObj) {
                    // console.log('userObj', userObj);
                    resolve(userObj);
                } else {
                    reject('err');
                }
            })
            .catch((err) => {
                resolve('aa');
            });
    });
}

function getAllProjects(req, res) {
    return new Promise((resolve) => {
        userResource.findAll({where: {resource_client_id: Number(req.authData.PM_Client_ID), resource_user_id: Number(req.authData.PM_UserID)}})
            .then((resouces) => {
                // console.log('client.PM_Plan_Id', resouces);
                resolve(resouces);
            })
            .catch((err) => {
                resolve('aa');
            });
    });
}

function userClient(req, res) {
    return new Promise((resolve) => {
        RegisterClient.findOne({where: {PM_Client_ID: Number(req.authData.PM_Client_ID)}})
            .then((client) => {
                // console.log('client.PM_Plan_Id', client);
                resolve(client);
            })
            .catch((err) => {
                resolve('aa');
            });
    });
}

async function getUserDetail(req, res) {
    const activePlan = await getActivePlan(req, res);
    const activeUsers = await getActiveUsers(req, res);
    const loggedInUsers = await getLoggedInUsers(req, res);
    const currentOrder = await getOrderDetails(activePlan.PLAN_ID, req.authData.PM_Client_ID);
    const client = await userClient(req, res);
    const projects = await getAllProjects(req, res);
    const userDetails = await userDetail(req, res);

    const myaccount = {
        activeUsers: activeUsers.length,
        loggedInUsers: loggedInUsers.length,
        totalUsers: activePlan.PLAN_USERS,
        expiryDate: new Date(currentOrder.ORDER_EXPIRY_DATE).toDateString(),
        companyName: client.PM_Client_CompanyName,
        domainName: client.PM_Client_Domain,
        assignedProjects: projects.length,
        createdAt: userDetails.createdAt,
    };
    return myaccount;
}

export function accountDetail(req, res) {
    console.log('myaccount');
    getUserDetail(req, res)
        .then((accountDetail) => {
            // console.log('accountDetail',accountDetail);
            res.send(accountDetail);
        })
        .catch((err) => {
            res.json({
                success: false,
                msg: 'something went wrong',
            });
        });
}

export function upgrade() {

}

export function payEarly() {

}

export function billingDetails(req, res) {
    console.log('req.authData', req.authData);
    Order.findAll({where: {ORDER_DOMAIN_ID: Number(req.authData.PM_Domain_ID), ORDER_STATE: 3}})
        .then(orders => res.send(orders));
}

export function reportIssue(req, res) {
    const reportedIssue = {
        issue_domain_id: req.authData.PM_Domain_ID,
        issue_reported_date: new Date(),
        issue_type: req.body.issueType,
        issue_user_type: req.body.userType,
        issue_content: req.body.issue,
    };
    ReportIssue.create(reportedIssue)
        .then((issue) => {
            res.send({success: true, msg: 'Issue is reported successfully'});
        })
        .catch((err) => {
            console.log('errrrrr', err);
        });
}

export function getIssueType(req, res) {
    res.send({success: true, msg: ['I can not see my project', 'I can not upgrade my licence']});
}

function generatePassword(password) {
    return new Promise((resolve) => {
        const key = crypto.createCipher('aes-128-cbc', 'abc');// abc replace by some data
        let newPassword = key.update(password, 'utf8', 'hex');
        newPassword += key.final('hex');
        resolve(newPassword);
    });
}

export function setPassword(req, res) {
    if(req.body.password) {
        generatePassword(req.body.password)
            .then((password) => {
                RegisterUser.update({PM_User_Login_PWD: password, PM_User_OTP: null, PM_User_OTPTime: null, PM_User_Status: true},
                    {where: {PM_User_MobileNumber: req.authData.PM_User_MobileNumber, PM_User_Email_ID: req.authData.PM_User_Email_ID, PM_Domain_ID: req.authData.PM_Domain_ID}})
                    .then((results2) => {
                        if(results2[0] === 1) {
                            // console.log('Your password has been changed successfully');
                            // res.send({ success: true, msg: 'Your password has been changed successfully' });

                            RegisterClient.update({PM_Client_Password: password, PM_Client_OTP: null, PM_Client_OTPTime: null},
                                {
                                    where: {
                                        PM_Client_MobileNumber: req.authData.PM_User_MobileNumber,
                                        PM_Client_Email: req.authData.PM_User_Email_ID,
                                        PM_Domain_ID: req.authData.PM_Domain_ID
                                    }
                                })
                                .then((results) => {
                                    res.send({success: true, msg: 'Your password has been changed successfully'});
                                });
                        } else {
                            res.send({success: false, msg: 'something went wrong'});
                        }
                    });
            });
    } else {
        res.send({success: false, msg: 'Please Enter Correct Existing password'});
    }
}


export function changePassword(req, res) {
    const condition = {
        where: Sequelize.and(
            {PM_Domain_ID: req.authData.PM_Domain_ID, PM_User_Active: 1},
            Sequelize.or(
                {
                    PM_User_MobileNumber: req.authData.PM_User_MobileNumber,
                },
                {
                    PM_User_Email_ID: req.authData.PM_User_Email_ID,
                },
            ),
        ),
    };
    RegisterUser.findOne(condition)
        .then((userObj) => {
            if(userObj) {
                const key = crypto.createCipher(process.env.CRYPTO_ALGO, 'abc');// abc replace by some data
                const key1 = crypto.createCipher(process.env.CRYPTO_ALGO, 'abc');// abc replace by some data
                let ExistingPassword = key.update(req.body.ExistingPassword, 'utf8', 'hex');
                ExistingPassword += key.final('hex');
                let newPassword = key1.update(req.body.password, 'utf8', 'hex');
                newPassword += key1.final('hex');
                if(userObj.PM_User_Login_PWD === ExistingPassword) {
                    if(userObj.PM_User_Login_PWD === newPassword) {
                        res.status(200)
                            .json({success: false, msg: 'New password and old password should not be same'});
                    } else {
                        setPassword(req, res);
                    }
                } else {
                    res.status(200)
                        .json({success: false, msg: 'Please Enter Correct Existing password'});
                    // res.send({ success: false, msg: 'Incorrect Password1' });
                }
            } else {
                res.status(200)
                    .json({success: false, msg: 'Please Enter Correct Existing password'});
            }
        });
}
