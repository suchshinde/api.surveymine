/**
 * Sequelize initialization module
 */
import Sequelize from 'sequelize';
import CONFIG from '../config/environment';

// console.log(CONFIG)
const db = {
    Sequelize,
    sequelize: new Sequelize(CONFIG.PORTAL_DB_NAME, CONFIG.DB_USERNAME, CONFIG.DB_PASSWORD, {
        host: CONFIG.DB_HOST,
        dialect: 'mysql',
        logging: false,

        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },

        // SQLite only

        // http://docs.sequelizejs.com/manual/tutorial/querying.html#operators
        operatorsAliases: false,
    }),
};

// Insert models below
db.RegisterClient = db.sequelize.import('../api/register/clientregister.model');
db.Order = db.sequelize.import('../api/myaccount/order.model');
db.ReportIssue = db.sequelize.import('../api/myaccount/report.model');
db.Subscription = db.sequelize.import('../api/myaccount/subscription.model');
// db.RegisterUser = db.sequelize.import('../../api/register/userregister.model');
// db.LoginSession = db.sequelize.import('../../api/login/loginsession.model');
// db.RegisterUser = db.sequelize.import('UserRegister', require('../api/register/register.model'));

module.exports = db;
