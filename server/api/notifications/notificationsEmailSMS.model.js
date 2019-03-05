/**
 * @Module Notofication Engine
 * @Developer Sudattakumar Kamble
 * @Designation Software Engineer
 * @Company MobiNext Technologies Private Limited
 * @StartDate 4 Oct 2018
 * @LastModifiedDate 15 Oct 2018
 */

export default function (sequelize, DataTypes) {
  return sequelize.define('NotificationsEmailSMS', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    senderEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    senderMobile: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    recipients: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    messageChannel: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    messageType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    messageString: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    messageStatus: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    priority: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    templateBody: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    freezeTableName: true,
  });
}
