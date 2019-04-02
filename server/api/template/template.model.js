'use strict';

export default function(sequelize, DataTypes) {
  return sequelize.define('TemplateMaster', {
    _Id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
      templateName: {
          type: DataTypes.STRING,
          allowNull: false,
      },
      template: {
          type: DataTypes.JSON,
          allowNull: false,
      },
      catagoryId: {
          type: DataTypes.INTEGER,
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
      templateDescr: {
          type: DataTypes.STRING,
          allowNull: false,
      }

  });
}
