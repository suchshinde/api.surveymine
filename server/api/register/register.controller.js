/* eslint-disable consistent-return,max-len,no-unused-vars */

import crypto from 'crypto';
import SendOtp from 'sendotp';
import otpGenerator from 'otp-generator';
import nodemailer from 'nodemailer';
import moment from 'moment';
import fs from 'fs';
import handlebars from 'handlebars';
import {Register, RegisterUser, Sequelize} from '../../sqldb';
import {RegisterClient} from '../../sqldb/portal.db';
import {logger} from '../../components/logger';

function userRegister(userObj, ID) {
    return new Promise((resolve) => {
        const post = {
            PM_Client_ID: ID,
            PM_User_FullName: userObj.firstName,
            PM_User_MobileNumber: userObj.mobileNo,
            PM_User_Email_ID: userObj.email,
            PM_User_Role: 'user',
            PM_User_Status: false,
            PM_User_AccessLevel: 'All',
            PM_Domain: userObj.domain,
            PM_User_DateofRegistration: new Date(),
        };

        RegisterUser.create(post)
            .then((x) => {
                const infoObj = {
                    registerFlag: x.dataValues.PM_UserID,
                };
                resolve(infoObj);
            })
            .catch((err) => {
                const infoObj = {
                    registerFlag: false,
                    msg: err.errors[0].message,
                };
                resolve(infoObj);
            });
    });
}

export function generatePassword(password) {
    return new Promise((resolve) => {
        const key = crypto.createCipher('aes-128-cbc', 'abc');// abc replace by some data
        let newPassword = key.update(password, 'utf8', 'hex');
        newPassword += key.final('hex');
        resolve(newPassword);
    });
}

function clientRegister(userObj) {
    return new Promise((resolve) => {
        const post = {
            PM_Client_Name: userObj.firstName,
            PM_Client_FirstName: userObj.firstName,
            PM_Client_MobileNumber: userObj.mobileNo,
            PM_Client_Email: userObj.email,
            PM_Client_DateofRegistration: new Date(),
            PM_Client_Domain: userObj.domain,
            PM_Agreement_Accept: userObj.agreementAccept
        };
        Register.create(post)
            .then((x) => {
                const infoObj = {
                    registerFlag: x.dataValues.PM_Client_ID,
                };
                resolve(infoObj);
            })
            .catch((err) => {
                const infoObj = {
                    registerFlag: false,
                    msg: err.errors[0].message,
                };
                resolve(infoObj);
            });
    });
}

export function sendOTP(email, mobileNo, domain, fromWhere, res) {
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
            { PM_Domain: domain },
            Sequelize.or(
                {
                    PM_User_MobileNumber: mobileNo,
                },
                {
                    PM_User_Email_ID: email,
                },
            ),
        ),
    };
    RegisterUser.update({PM_User_OTP: OTP, PM_User_OTPTime: dateofOtp},
        condition)
        .then((results) => {
            if(results[0] === 1) {
                const filePath = `${__dirname}/otpTemplate.html`;
                if(fs.existsSync(filePath)) {
                    fs.readFile(filePath, 'utf8', (err, data) => {
                        const template = handlebars.compile(data);
                        const dataObj = {otp: OTP};
                        const imageUrl = `${process.env.PROTOCOL}${process.env.MAIN_DOMAIN}`;
                        const body = template({data: dataObj, imageUrl});
                        let subject = 'Please confirm your Email account';
                        if(fromWhere === 3) {
                            subject = 'Reset Password';
                        }
                        const mailOptions = {
                            to: email,
                            subject,
                            html: body,
                        };
                        smtpTransport.sendMail(mailOptions, (error) => {
                            if(error) {
                                // res.end("error");
                                logger.error({
                                    msg: 'otp sending error',
                                    error,
                                });
                            } else {
                                smtpTransport.close();
                            }
                        });
                    });
                }
                optSender.send(mobileNo, 'PRIIND', OTP, (error) => {
                    if(error) {
                        logger.error({
                            msg: 'otp sending error',
                            error,
                        });
                    }
                });
                res.status(201)
                    .json({
                        success: true,
                        msg: 'Please verify account',
                        email,
                        mobileNo,
                        domain,
                    });
            } else {
                res.status(403)
                    .send({success: false, msg: 'Account is not found'});
            }
        });
}

async function insertUser(userObj) {
    let infoObj = {};
    console.log();
    if(userObj.fromWhere === 2) {
        infoObj.registerFlag = userObj.clientID;
        console.log('if');
    }
    if(userObj.fromWhere === 1) {
        infoObj = await clientRegister(userObj);
        console.log('if2');
    }
    if(infoObj.registerFlag) {
        console.log('if3');
        infoObj = await userRegister(userObj, infoObj.registerFlag);
        if(infoObj.registerFlag) {
            return {msg: 'hi', success: true};
        }
        return {msg: infoObj.msg, success: false};
    }
    return {msg: infoObj.msg, success: false};
}


export function index(req, res) {
    console.log('amit');
    insertUser(req.body)
        .then((obj) => {
            console.log(obj);
            if(obj.success) {
                // res.send(obj);
                sendOTP(req.body.email, req.body.mobileNo, req.body.domain, req.body.fromWhere, res);
            } else {
                res.status(500)
                    .json(obj);
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(500)
                .json({
                    success: false,
                    msg: 'something went wrong',
                });
            logger.error({
                msg: 'Unauthorised',
                error: err,
            });
        });
}

export function verifyOTP(req, res) {
    RegisterUser.findOne({
        where: {
            PM_User_Email_ID: req.body.email,
            PM_User_MobileNumber: req.body.mobileNo,
            PM_Domain: req.body.domain
        }
    })
        .then((results) => {
            if(results) {
                if(parseInt(results.PM_User_OTP, 10) === parseInt(req.body.otp, 10)) {
                    const timeDiff = (new Date().getTime() -
                        new Date(results.PM_User_OTPTime).getTime()) / 1000;
                    if(timeDiff <= process.env.OTP_TIME) {
                        generatePassword(req.body.password)
                            .then((password) => {
                                if(password !== results.PM_User_Login_PWD) {
                                    RegisterUser.update({
                                            PM_User_Login_PWD: password,
                                            PM_User_OTP: null,
                                            PM_User_OTPTime: null,
                                            PM_User_Status: true,
                                            IsLock: false,
                                        },
                                        {
                                            where: {
                                                PM_User_MobileNumber: req.body.mobileNo,
                                                PM_User_Email_ID: req.body.email,
                                                PM_Domain: req.body.domain,
                                            },
                                        })
                                        .then((results1) => {
                                            if(results1[0] === 1) {
                                                RegisterClient.update({
                                                        PM_Client_Password: password,
                                                        PM_Client_OTP: null,
                                                        PM_Client_OTPTime: null,
                                                    },
                                                    {
                                                        where: {
                                                            PM_Client_MobileNumber: req.body.mobileNo,
                                                            PM_Client_Email: req.body.email,
                                                            PM_Client_Domain: req.body.domain,
                                                        },
                                                    })
                                                    .then((results2) => {
                                                        res.status(200)
                                                            .send({
                                                                success: true,
                                                                msg: 'password updated successfully',
                                                            });
                                                    })
                                                    .catch((err) => {
                                                        logger.error({
                                                            msg: 'Something went wrong',
                                                            error: err,
                                                        });
                                                        res.status(500)
                                                            .send({success: false, msg: 'something went wrong'});
                                                    });
                                                // res.send({ success: true, msg: 'password updated successfully' });
                                            } else {
                                                res.status(500)
                                                    .send({success: false, msg: 'something went wrong'});
                                            }
                                        });
                                } else {
                                    res
                                        .send({success: false, msg: 'New password and old password should not be same'});
                                }
                            });
                    } else {
                        return res.status(408)
                            .send({
                                success: false,
                                msg: 'OTP entered is expired. Please click RESEND OTP in order to receive new OTP',
                            });
                    }
                } else {
                    return res.status(422)
                        .send({success: false, msg: 'OTP is Wrong'});
                }
            } else {
                return res.status(404)
                    .send({success: false, msg: 'Account not found'});
            }
        });
}

export function generateOTP(req, res) {
    sendOTP(req.body.email, req.body.mobileNo, req.body.domain, req.body.fromWhere, res);
}

export function userNewRegister(req, res) {
    req.body.domain = req.authData.PM_Domain;
    // index(req, res);
    userRegister(req.body, req.authData.PM_Client_ID)
        .then((obj) => {
            if(obj.registerFlag === false) {
                res.status(500)
                    .send(obj);
            } else {
                res.status(201)
                    .send({status: true, msg: 'User Created sucessfully'});
            }
        });
}

// export function setPassword(req, res) {
//   RegisterUser.findOne({ where: { PM_User_MobileNumber: req.body.mobileNo, PM_Domain: req.body.domain, PM_User_Email_ID: req.body.email } }).then((user) => {
//     if (user) {
//       if (user.PM_User_OTP === null) {
//         generatePassword(req.body.password)
//           .then((password) => {
//             console.log(password);
//             RegisterUser.update({ PM_User_Login_PWD: password },
//               { where: { PM_User_MobileNumber: req.body.mobileNo, PM_User_Email_ID: req.body.email } })
//               .then((results) => {
//                 console.log(results[0]);
//                 if (results[0] === 1) {
//                   res.send({ success: true, msg: 'password updated sucessfully' });
//                 } else {
//                   res.send({ success: false, msg: 'something went wrong' });
//                 }
//               });
//           });
//       } else {
//         res.send({ success: false, msg: 'Account is not verified for password changed' });
//       }
//     } else {
//       res.send({ success: false, msg: 'Account is not found' });
//     }
//   });
// }
