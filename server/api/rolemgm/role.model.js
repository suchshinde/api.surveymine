

export default function(sequelize, DataTypes) {
    return sequelize.define('Role', {
        ID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        PM_Client_ID: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        Description: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        IsMobile: {
            type: DataTypes.BOOLEAN,
        },
        IsWeb: {
            type: DataTypes.BOOLEAN,
        },
        Status: {
            type: DataTypes.BOOLEAN,
        },
        Permission: {
            type: DataTypes.STRING,
        },
    }, {
        freezeTableName: true,

    });
}
