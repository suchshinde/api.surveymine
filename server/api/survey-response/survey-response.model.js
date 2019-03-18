export default function (sequelize, DataTypes) {
    return sequelize.define('SurveyResponse', {
        Id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        surveyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        clientId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        versionId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        surveyUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        responseBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        surveyType: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        surveyStatus: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        responseStatus: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        responseAt: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        responseJson: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        responseCount: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    });
}
