'use strict';

export default function(sequelize, DataTypes) {
  return sequelize.define('CatagoryMaster', {
    Id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
      catagoryName: {
          type: DataTypes.STRING,
          allowNull: false,
      },
      createdBy: {
          type: DataTypes.INTEGER,
          allowNull: false,
      },
      clientId: {
          type: DataTypes.INTEGER,
          allowNull: false,
      },
      createdAt: {
          type: DataTypes.STRING,
          allowNull: false,
      },
  });
}
