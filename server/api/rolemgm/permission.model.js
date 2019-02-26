

export default function (sequelize, DataTypes) {
  return sequelize.define('MIDAS_M_Permission', {
    ID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    Description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Status: {
      type: DataTypes.BOOLEAN,
    },
  }, {
    freezeTableName: true,

  });
}
