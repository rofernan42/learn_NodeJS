// const mysql = require('mysql2');

// const pool = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     database: 'learn_nodejs',
//     password: '123456'
// });

// module.exports = pool.promise(); // promise() allows to work with asynchronous code, methods .then() and .catch()


const Sequelize = require('sequelize');

const sequelize = new Sequelize('learn_nodejs', 'root', '123456', {
    dialect: 'mysql',
    host: 'localhost',
    timestamps: true
});

module.exports = sequelize;
