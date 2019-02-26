export default function(sequelize, DataTypes) {
    return sequelize.define('survey', {

            survey_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            client_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            version_id: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            client_logo: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            survey_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            survey_template: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            survey_creator: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            survey_created_at: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            survey_description: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
            },
            survey_type: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            survey_status: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            survey_updated_at: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            assigned_to: {
                type: DataTypes.ARRAY,
                allowNull: true,
            },

        },
        {
            freezeTableName: true,
        },
    );}
