/* eslint-disable max-len,import/prefer-default-export,no-shadow,consistent-return */
import jwt from 'jsonwebtoken';
import { logger } from '../components/logger';

const redisClient = require('../config/redis').redisClient;


/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 401
 */

export function isAuthenticated(req, res, next) {
    const bearerHeader = req.header('Authorization');
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        req.token = bearer[1];
        jwt.verify(req.token, process.env.JWT_SECKERT_KEY, (err, authData) => {

            if (err || typeof authData === 'undefined') {
                logger.error({
                    msg: 'Unauthorised',
                    error: err,
                });
                res.status(401).json({ success: false, msg: 'Unauthorised access3' });
            } else {
                redisClient.get(`${authData.user.PM_User_MobileNumber}login${authData.user.PM_Client_ID}`, (err, reply) => {
                    if (err) {
                        logger.error({
                            msg: 'Unauthorised',
                            error: err,
                        });
                        res.status(401).json({ success: false, msg: 'Unauthorised access2' });
                    } else if (reply === req.token) {
                        redisClient.set(`${authData.user.PM_User_MobileNumber}`, `${req.token}`);
                        // redisClient.expire(`${authData.user.PM_User_MobileNumber}`, process.env.IDEL_SESSION_TIME); // session time
                        req.authData = authData.user;
                        return next();
                    } else {
                        res.status(401).json({ success: false, msg: 'Unauthorised access1' });
                    }
                });
            }
        });
    } else {
        res.status(401).json({ success: false, msg: 'Unauthorised access4' });
    }
    // });
}
