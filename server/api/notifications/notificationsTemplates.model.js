/**
 * @Module Notofication Engine
 * @Developer Sudattakumar Kamble
 * @Designation Software Engineer
 * @Company MobiNext Technologies Private Limited
 * @StartDate 4 Oct 2018
 * @LastModifiedDate 9 Oct 2018
 */

export default function (sequelize, DataTypes) {
  return sequelize.define('NotificationsTemplatesNEW', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    messageType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    templateName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    messageChannel: {
      type: DataTypes.STRING,
    },
  }, {
    freezeTableName: true,
  });
}
