/* eslint-disable max-len */
import { LoginSession } from '../sqldb';

const redisClient = require('../config/redis').redisClient;

export default function permit(...allowed) {
    // const isAllowed = role => allowed.indexOf(role) > -1;
    // return a middleware
    return (req, res, next) => {
        let permissonArr = req.authData.Permission.map((a) => {
            if(a.Status) {
                return a.Type;
            }
            return null;
        });

        permissonArr = permissonArr.map(a => a);
        const found = allowed.some(r => permissonArr.includes(r));
        if(found) {
            next();
        } else {
            redisClient.del(`${req.authData.PM_User_MobileNumber}login${req.authData.PM_Client_ID}`, (err) => {

            });
            LoginSession.update({ LoginStatus: 0, TimestampLogout: new Date() },
                { where: { UserID: req.authData.PM_UserID, LoginStatus: 1 } });

            res.status(401).json({ success: false, message: 'Unauthorised access1' });
        }
    };
    // user is forbidden
}
