export default function (sequelize, DataTypes) {
    return sequelize.define('SurveyIdGenerator', {
        surveyId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            initialAutoIncrement: 99999
        },
        clientId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        createdAt: {
            type: DataTypes.STRING,
            allowNull: true,
        }
    });
}
