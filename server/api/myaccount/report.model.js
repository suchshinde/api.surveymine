export default function (sequelize, DataTypes) {
  return sequelize.define('pms_issue', {
    issue_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    issue_domain_id: {
      type: DataTypes.INTEGER,
    },
    issue_reported_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    issue_type: {
      type: DataTypes.STRING,
    },
    issue_user_type: {
      type: DataTypes.STRING,
    },
    issue_content: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
  });
}
