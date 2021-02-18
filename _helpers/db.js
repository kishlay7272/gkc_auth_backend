const { Sequelize, QueryTypes } = require('sequelize');
module.exports = {
    get_connection: async function() {
        let sequelize = new Sequelize('mysql://root:p64266426@localhost:3306/mydb');
        try {
            await sequelize.authenticate();
            console.log('Connection has been established successfully.');
            return sequelize;
        } catch (error) {
            console.error('Unable to connect to the database:', error);
        }

    },
    db:new Sequelize('mysql://root:p64266426@localhost:3306/mydb')
}
