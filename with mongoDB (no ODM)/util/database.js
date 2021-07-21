// const mysql = require('mysql2');

// const pool = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     database: 'learn_nodejs',
//     password: '123456'
// });

// module.exports = pool.promise(); // promise() allows to work with asynchronous code, methods .then() and .catch()

const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = callback => {
    MongoClient.connect('mongodb+srv://romain:LUJODAVfeltMTpKv@cluster0.ub4t7.mongodb.net/shop?retryWrites=true&w=majority')
    .then(client => {
        _db = client.db();
        callback();
    })
    .catch((err) => {
        throw err;
    });
};

const getDb = () => {
    if (_db) {
        return _db;
    }
    throw "No database found";
}

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
