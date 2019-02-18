export default function (sequelize, DataTypes) {
  return sequelize.define('PM_T_PRICING_PLANS', {
    PLAN_ID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    PLAN_TITLE: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    PLAN_INSTALLATION_TYPE: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    PLAN_DESCRIPTION: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    PLAN_SUBSCRIPTION_TYPE: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    PLAN_DURATION: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    PLAN_USERS: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    PLAN_PRICE: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    PLAN_PROJECT: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    PLAN_ROLES: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    PLAN_SPACE: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    PLAN_AUTOBACKUP: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    PLAN_ISCLOUD: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    PLAN_STATUS: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    PLAN_DISCOUTN_PERCENT: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    TAX: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    PLAN_ISDEFAULT: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },

  },
  {
    freezeTableName: true,
  });
}
