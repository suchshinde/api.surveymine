/**
 * @Module Notofication Engine
 * @Developer Sudattakumar Kamble
 * @Designation Software Engineer
 * @Company MobiNext Technologies Private Limited
 * @StartDate 4 Oct 2018
 * @LastModifiedDate 15 Oct 2018
 */

export default function (sequelize, DataTypes) {
  return sequelize.define('PermissionNotify', {
    permission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    notify_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    freezeTableName: true,
  });
}
