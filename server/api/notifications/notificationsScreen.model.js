/**
 * @Module Notofication Engine
 * @Developer Sudattakumar Kamble
 * @Designation Software Engineer
 * @Company MobiNext Technologies Private Limited
 * @StartDate 4 Oct 2018
 * @LastModifiedDate 15 Oct 2018
 */

export default function (sequelize, DataTypes) {
  return sequelize.define('NotificationsScreen', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'UserAccess',
        key: 'PM_UserID',
      },
    },
    recipientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      /* references: 'PM_M_UserAccess',
      referencesKey: 'id', */
    },
    messageType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    /* messageString: {
      type: DataTypes.STRING,
      allowNull: false,
    }, */
    messageSubject: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isWeb: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isMob: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    projectId: {
      type: DataTypes.INTEGER,
      defaultValue: null,
    },
    subProjectId: {
      type: DataTypes.INTEGER,
      defaultValue: null,
    },
    milestoneId: {
      type: DataTypes.INTEGER,
      defaultValue: null,
    },
    taskId: {
      type: DataTypes.INTEGER,
      defaultValue: null,
    },
    projectName: {
      type: DataTypes.STRING,
      defaultValue: null,
    },
    projectType: {
      type: DataTypes.STRING,
      defaultValue: null,
    },
    projectRole: {
      type: DataTypes.TEXT('long'),
      defaultValue: null,
    },
    subProjectName: {
      type: DataTypes.STRING,
      defaultValue: null,
    },
    subProjectType: {
      type: DataTypes.STRING,
      defaultValue: null,
    },
    milestoneDescription: {
      type: DataTypes.TEXT('long'),
      defaultValue: null,
    },
    taskName: {
      type: DataTypes.STRING,
      defaultValue: null,
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    taskImgIds: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    star: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    subProjectIds: {
      type: DataTypes.TEXT('long'),
      defaultValue: null,
    },
    milestoneIds: {
      type: DataTypes.TEXT('long'),
      defaultValue: null,
    },
    taskIds: {
      type: DataTypes.TEXT('long'),
      defaultValue: null,
    },
  }, {
    freezeTableName: true,
  });
}
