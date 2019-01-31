/*eslint no-process-env:0*/

// Development specific configuration
// ==================================
module.exports = {

    // Sequelize connection options
    sequelize: {
        uri: 'sqlite://',
        options: {
            logging: false,
            operatorsAliases: false,
            storage: 'dev.sqlite',
            define: {
                timestamps: false
            }
        }
    },

    // Seed database on startup
    seedDB: true,
};
