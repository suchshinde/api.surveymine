export default function(sequelize, DataTypes) {
    return sequelize.define('SurveyUser', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        client_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        survey_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        version_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        creator: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    });
}
