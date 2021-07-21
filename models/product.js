const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User', // sert a dire que l'ObjectId refere a un user
        required: true
    }
});

module.exports = mongoose.model('Product', productSchema); // crée la collection 'products'




// const mongodb = require('mongodb');
// const getDb = require('../util/database').getDb;

// class Product {
//     constructor(title, price, description, imageUrl, id, userId) {
//         this.title = title;
//         this.imageUrl = imageUrl;
//         this.description = description;
//         this.price = price;
//         this._id = id ? new mongodb.ObjectId(id) : null;
//         this.userId = userId;
//     }

//     save() {
//         const db = getDb();
//         let dbOp;
//         if (this._id) {
//             dbOp = db.collection('products').updateOne(
//                 { _id: this._id },
//                 { $set: this }
//             );
//         } else {
//             dbOp = db.collection('products').insertOne(this);
//         }
//         return dbOp.then().catch();
//     }

//     static fetchAll() {
//         const db = getDb();
//         return db.collection('products')
//             .find()
//             .toArray()
//             .then(products => {
//                 return products;
//             })
//             .catch();
//     }

//     static findById(prodId) {
//         const db = getDb();
//         return db.collection('products')
//             .find({ _id: new mongodb.ObjectId(prodId) }).next() // le _id est un objet de type ObjectId donc on ne peut pas le comparer directement a prodId qui est une string
//         // on peut faire aussi .find({...}).toArray().then(products => { return products[0] }).catch();
//     }

//     static deleteById(prodId) {
//         const db = getDb();
//         return db.collection('products')
//             .deleteOne({ _id: new mongodb.ObjectId(prodId) })
//             .then()
//             .catch();
//     }
// }

// module.exports = Product;