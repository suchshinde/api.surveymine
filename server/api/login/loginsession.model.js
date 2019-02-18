export default function(sequelize, DataTypes) {
    return sequelize.define('LoginSession', {
            ID: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            TimestampLogin: {
                type: DataTypes.DATE,
                allowNull: false,

            },
            UserID: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            ClientID: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            LoginStatus: DataTypes.INTEGER,
            LoginDevice: DataTypes.STRING,
            IMEI: DataTypes.STRING,
            TimestampLogout: DataTypes.DATE,
            IsFailed: DataTypes.INTEGER,
        },
        {
            freezeTableName: true,

        });
}
