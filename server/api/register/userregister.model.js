export default function(sequelize, DataTypes) {
    return sequelize.define('UserAccess', {
        PM_UserID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        PM_Client_ID: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        PM_User_Login_PWD: {
            type: DataTypes.STRING,
        },
        PM_User_Login_ForceChangePWD: {
            type: DataTypes.STRING,
        },
        PM_User_Email_ID: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: {
                    msg: 'Invalid Email',
                },
            },
        },
        PM_Domain: {
            type: DataTypes.STRING,
            allowNull: {
                msg: 'Domain Name Can Not be Empty',
            },
        },
        PM_Domain_ID: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        PM_User_MobileNumber: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        PM_User_Mobile_IMIE: DataTypes.STRING,
        PM_User_Role: DataTypes.STRING,
        PM_User_AccessLevel: DataTypes.STRING,
        PM_User_Department: DataTypes.STRING,
        PM_User_FullName: DataTypes.STRING,
        PM_User_Address: DataTypes.STRING,
        PM_User_State: DataTypes.STRING,
        PM_User_District: DataTypes.STRING,
        PM_User_Village: DataTypes.STRING,
        PM_User_Pincode: DataTypes.STRING,
        PM_User_Status: DataTypes.BOOLEAN,
        IsLock: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        PM_User_SupervisorID: DataTypes.STRING,
        PM_User_DateofRegistration: {
            type: DataTypes.DATE,
            allowNull: false,

        },
        PM_User_OTP: DataTypes.STRING,
        PM_User_OTPTime: {
            type: DataTypes.DATE,
        },
        PM_FirstLogin: DataTypes.BOOLEAN,
        PM_User_Active: DataTypes.BOOLEAN,
        PM_Designation: DataTypes.STRING,
        PM_User_ProfilePic: DataTypes.TEXT('long'),
    }, {
        freezeTableName: true,

    });
}
