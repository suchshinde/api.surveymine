/**
 * Created by swati on 2/4/19.
 */
export default function (sequelize, DataTypes) {
    return sequelize.define('QuestionBankMaster', {
        Id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        question: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        questionType: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        categoryId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        questionAnswers: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        createdAt: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    });
}
