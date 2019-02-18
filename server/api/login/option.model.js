export default function(sequelize, DataTypes) {
    return sequelize.define('Option', {
            ID: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            Description: {
                type: DataTypes.STRING,
                allowNull: false,

            },
            PermissionID: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            Status: DataTypes.BOOLEAN,
            RouterLink: DataTypes.STRING,
            Icon: DataTypes.STRING,
        },
        {
            freezeTableName: true,

        });
}
