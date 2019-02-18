export default function (sequelize, DataTypes) {
  return sequelize.define('resource_role', {
    resource_role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    resource_role_resource_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Resource',
        key: 'resource_id',
      },
    },
    resource_role_role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'MIDAS_M_Role',
        key: 'ID',
      },
    },
    resource_role_status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  }, {
    freezeTableName: true,
  });
}
