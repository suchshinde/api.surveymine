export default function(sequelize, DataTypes) {
  return sequelize.define('Menu', {
    ID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    permissionID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    optionID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
  }, {
    freezeTableName: true,
  });
}
