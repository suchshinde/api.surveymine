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
db.RegisterUser = db.sequelize.import('../api/register/userregister.model');
db.Thing = db.sequelize.import('../api/thing/thing.model');
db.UserRole = db.sequelize.import('../api/user/userrole.model');
db.Role = db.sequelize.import('../api/rolemgm/role.model');
db.RolePermission = db.sequelize.import('../api/rolemgm/rolepermission.model.js');
db.Permission = db.sequelize.import('../api/rolemgm/permission.model');
db.Option = db.sequelize.import('../api/login/option.model');
db.Menu = db.sequelize.import('../api/rolemgm/menu.model');
db.LoginSession = db.sequelize.import('../api/login/loginsession.model');
db.Resource = db.sequelize.import('../api/resource/resource.model');
db.Register = db.sequelize.import('../api/register/clientregister.model');
db.Surveys = db.sequelize.import('../api/survey/survey.model');
db.SurveyUser = db.sequelize.import('../api/survey-user/survey-user.model')

db.SurveyUser.hasMany(db.Surveys, { as: 'UserOrders', foreignKey: 'ORDER_CLIENT_ID' });

module.exports = db;
