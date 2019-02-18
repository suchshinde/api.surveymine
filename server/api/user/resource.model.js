export default function(sequelize, DataTypes) {
    return sequelize.define('Resource', {
        resource_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        resource_client_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        resource_project_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        resource_user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'UserAccess',
                key: 'PM_UserID',
            },
        },
        resource_user_role: DataTypes.STRING,
        resource_status: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    }, {
        freezeTableName: true,
    });
}
