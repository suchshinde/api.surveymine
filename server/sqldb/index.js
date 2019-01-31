/**
 * Sequelize initialization module
 */
import CONFIG from '../config/environment';
import Sequelize from 'sequelize';

const db = {
    Sequelize,
    sequelize: new Sequelize(CONFIG.DB_NAME, CONFIG.DB_USERNAME, CONFIG.DB_PASSWORD, {
        host: CONFIG.DB_HOST,
        dialect: 'mysql',
        logging: false,
        timezone: '+05:30',
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

module.exports = db;
