export default function (sequelize, DataTypes) {
    return sequelize.define('Survey', {
            Id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            surveyId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            clientId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            versionId: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            clientLogo: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            surveyName: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            surveyTemplate: {
                type: DataTypes.JSON,
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
            surveyCreatedAt: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            surveyDescription: {
                type: DataTypes.TEXT('long'),
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
            surveyUpdated_at: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            assignedTo: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            freezeTableName: true,
        },
    );
}
