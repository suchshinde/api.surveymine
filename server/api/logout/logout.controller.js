/* eslint-disable no-unused-vars */
import {LoginSession} from '../../sqldb';
import {RegisterClient} from '../../sqldb/portal.db';
import {logger} from '../../components/logger';
const redisClient = require('../../config/redis').redisClient;

export function index(req, res) {
    redisClient.del(`${req.authData.PM_User_MobileNumber}login${req.authData.PM_Client_ID}`, (err) => {
        if(err) {
            logger.error({
                msg: 'logout',
                error: err,
            });
            res.status(500)
                .json({
                    success: true,
                    msg: 'logout',
                });
        } else {
            res.status(200)
                .json({
                    success: true,
                    msg: 'logout',
                });
        }
    });
    LoginSession.update({LoginStatus: 0, TimestampLogout: new Date()},
        {where: {UserID: req.authData.PM_UserID, LoginStatus: 1}})
        .then((results) => {
        })
        .catch((err) => {
            logger.error({
                msg: 'logout session',
                error: err,
            });
        });
}

export function forceLogout(req, res) {
    RegisterClient.findOne({
        where:
            {PM_Client_Domain: req.body.domain},
        raw: true,
        attributes: ['PM_Client_ID']
    })
        .then((clientID) => {
            console.log('in auth', clientID);

            if(clientID) {
                redisClient.del(`${req.body.mobileNo}login${clientID.PM_Client_ID}`, (err) => {
                    if(err) {
                        res.status(500)
                            .json({
                                success: true,
                                msg: 'logout',
                            });
                    } else {
                        res.status(200)
                            .json({
                                success: true,
                                msg: 'logout',
                            });
                    }
                });
            }
            LoginSession.update({LoginStatus: 0, TimestampLogout: new Date()},
                {where: {UserID: req.body.UserID, LoginStatus: 1}})
                .then((results) => {
                })
                .catch((err) => {
                    logger.error({
                        msg: 'logout session',
                        error: err,
                    });
                    console.log('error', err);
                });
        });
}
