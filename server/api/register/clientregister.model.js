export default function(sequelize, DataTypes) {
    return sequelize.define('Client', {
            PM_Client_ID: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            PM_Client_Name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            PM_Client_Address: DataTypes.STRING,
            PM_Client_Logo: DataTypes.BLOB,
            PM_Client_Pic1: DataTypes.BLOB,
            PM_Client_Pic2: DataTypes.BLOB,
            PM_Client_MobileNumber: {
                type: DataTypes.STRING,
                allowNull: false,
                // unique: {
                //   msg: 'Already user Register1',
                // },
            },
            PM_Client_Email: {
                type: DataTypes.STRING,
                allowNull: false,
                // unique: {
                //   msg: 'Already user Register',
                // },
                validate: {
                    isEmail: {
                        msg: 'Invalid Email',
                    },
                },
            },
            PM_Client_Domain: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: {
                    msg: 'Domain Already Exist',
                },
            },
            PM_Client_Status: DataTypes.BOOLEAN,
            PM_Client_FirstName: DataTypes.STRING,
            PM_Client_CompanyName: DataTypes.STRING,
            PM_Client_DateofRegistration: {
                type: DataTypes.DATE,
                allowNull: false,

            },
            PM_Client_Password: {
                type: DataTypes.STRING,
            },
            PM_Client_OTP: DataTypes.STRING,
            PM_Client_OTPTime: {
                type: DataTypes.DATE,
            },
            PM_Plan_Id: {
                type: DataTypes.INTEGER,
            },
            PM_Plan_Status: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            PM_Agreement_Accept: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
            PM_Domain_ID: {
                type: DataTypes.INTEGER,
                allowNull: false,
                unique: {
                    msg: 'Domain Already Exist',
                },
            },
        },
        {
            // hooks: {
            //   beforeCreate: (user) => {
            //     console.log(user.dataValues);
            //     const key = crypto.createCipher(process.env.CRYPTO_ALGO, 'abc');
            //     let password = key.update(user.dataValues.PM_Client_Password, 'utf8', 'hex');
            //     password += key.final('hex');
            //     user.PM_Client_Password = password;
            //   },
            // },
            freezeTableName: true
        },
    );
}
