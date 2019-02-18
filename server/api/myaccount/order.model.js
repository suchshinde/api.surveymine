export default function (sequelize, DataTypes) {
  return sequelize.define('PM_ORDERS', {
    ORDER_ID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    ORDER_PLAN_ID: {
      type: DataTypes.INTEGER,
    },
    ORDER_CLIENT_ID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ORDER_DOMAIN_ID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ORDER_DATE: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    ORDER_EXPIRY_DATE: {
      type: DataTypes.DATE,
    },
    ORDER_PRICE: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ORDER_STATE: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ORDER_TRANSACTION_ID: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ORDER_TRANSACTION_DATE: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
  });
}
/* ORDER_STATE meaning
1-payment pending
2-payment initialized
3-payment done(paid plan activate)
4-free plan(free plan activate)
5-plan expired
*/
