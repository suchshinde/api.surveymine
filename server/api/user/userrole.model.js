export default function (sequelize, DataTypes) {
    return sequelize.define('UserRole', {
        ID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        clientID: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        userID: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        roleID: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.TINYINT,
            allowNull: false,
        },
    }, {
        freezeTableName: true,
    });
}
