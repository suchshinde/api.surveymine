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
db.Register = db.sequelize.import('../api/register/clientregister.model');
db.RegisterUser = db.sequelize.import('../api/register/userregister.model');
db.Thing = db.sequelize.import('../api/thing/thing.model');
db.Role = db.sequelize.import('../api/rolemgm/role.model');
db.Permission = db.sequelize.import('../api/rolemgm/permission.model');
db.UserRole = db.sequelize.import('../api/user/userrole.model');

db.Survey = db.sequelize.import('../api/survey/survey.model');
db.RolePermission = db.sequelize.import('../api/rolemgm/rolepermission.model.js');
db.Menu = db.sequelize.import('../api/rolemgm/menu.model');
db.Option = db.sequelize.import('../api/login/option.model');

db.LoginSession = db.sequelize.import('../api/login/loginsession.model');
db.Resource = db.sequelize.import('../api/resource/resource.model');

db.SurveyUser = db.sequelize.import('../api/survey-user/survey-user.model');
db.NotificationsEmailSms = db.sequelize.import('../api/notifications/notificationsEmailSMS.model');
db.NotificationsScreen = db.sequelize.import('../api/notifications/notificationsScreen.model');
db.NotificationsTemplates = db.sequelize.import('../api/notifications/notificationsTemplates.model');
db.PermissionNotify = db.sequelize.import('../api/notifications/permissionNotify.model');


db.RegisterUser.hasMany(db.LoginSession, {as: 'UserID', foreignKey: 'UserID'});
db.RegisterUser.hasMany(db.NotificationsScreen, {as: 'Notification', foreignKey: 'senderId'});
db.RegisterUser.hasMany(db.NotificationsScreen, {as: 'NotificationrecipientId', foreignKey: 'recipientId'});

db.Permission.hasMany(db.Menu, {as: 'PermissionMenu', foreignKey: 'permissionID'});

db.RegisterUser.hasMany(db.UserRole, {as: 'User', foreignKey: 'userID'});
db.Role.hasMany(db.UserRole, {as: 'Role', foreignKey: 'roleID'});
// db.UserRole.belongsTo(db.Role, { as: 'UserRole1', foreignKey: 'roleID' }); // if want to use main primary key table in include
// db.UserRole.belongsTo(db.RegisterUser, { as: 'UserRole2', foreignKey: 'userID' });


db.Role.hasMany(db.RolePermission, {as: 'RoleP', foreignKey: 'roleID'});
db.Permission.hasMany(db.RolePermission, {as: 'Permission1', foreignKey: 'permissionID'});
// db.RolePermission.belongsTo(db.Permission, { as: 'Permission2', foreignKey: 'permissionID' });
// db.Menu.belongsTo(db.Option, { as: 'option1', foreignKey: 'optionID' });

// db.RolePermission.belongsTo(db.Role, { as: 'Role3', foreignKey: 'roleID' });

//db.Survey.hasMany(db.SurveyUser, {as: 'UserSurvey', foreignKey: 'survey_id'});

module.exports = db;
