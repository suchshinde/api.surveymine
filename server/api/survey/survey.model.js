export default function(sequelize, DataTypes) {
    return sequelize.define('Survey', {
            // id: {
            //     type: DataTypes.INTEGER,
            //     allowNull: false,
            //     autoIncrement: true
            // },
            survey_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
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
                type: DataTypes.JSON,
                allowNull: true,
            },
            survey_url: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            created_by: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            survey_created_at: {
                type: DataTypes.STRING,
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
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            freezeTableName: true,
        },
    );
}
