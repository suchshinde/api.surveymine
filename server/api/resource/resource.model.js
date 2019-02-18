export default function(sequelize, DataTypes) {
    return sequelize.define('Resource', {

            resource_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            PM_Client_ID: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            PM_Project_ID: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            PM_SubProject_ID: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            PM_Milestone_ID: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            // PM_Task_ID: {
            //     type: DataTypes.INTEGER,
            //     allowNull: true,
            //     references: {
            //         model: 'Task', // <<< Note, its table's name, not object name
            //         key: 'PM_Task_ID', //
            //     },
            // },
            resource_type: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            resource_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            PM_Material_Unit: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            resource_allocated: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            resource_available: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            resource_utilized: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            Estimated: {
                type: DataTypes.DOUBLE,
                allowNull: true,
            },
        },
        {
            freezeTableName: true,
        },
    );
}
