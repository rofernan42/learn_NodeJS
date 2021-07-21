// const fs = require('fs');
// const path = require('path');

// const p = path.join(
//     path.dirname(require.main.filename),
//     'data',
//     'cart.json'
// );

// module.exports = class Cart {
//     static addProduct(id, productPrice) {
//         // fetch the previous cart
//         fs.readFile(p, (err, fileContent) => {
//             let cart = { products: [], totalPrice: 0 };
//             if (!err) {
//                 cart = JSON.parse(fileContent);
//             }
//             // analyze the cart => find existing product
//             const existingProductIndex = cart.products.findIndex(prod => prod.id === id);
//             const existingProduct = cart.products[existingProductIndex];
//             let updatedProduct;
//             //add new product / increase quantity
//             if (existingProduct) {
//                 updatedProduct = { ...existingProduct };
//                 updatedProduct.qty = updatedProduct.qty + 1;
//                 cart.products = [...cart.products];
//                 cart.products[existingProductIndex] = updatedProduct;
//             } else {
//                 updatedProduct = { id: id, qty: 1 };
//                 cart.products = [...cart.products, updatedProduct]
//             }
//             cart.totalPrice = cart.totalPrice + +productPrice; // le deuxieme '+' devant productPrice sert a convertir la variable en nombre (sinon c'est une string qu'il va concatener)
//             fs.writeFile(p, JSON.stringify(cart), err => {
//                 console.log(err);
//             });
//         });
//     }

//     static deleteProduct(id, productPrice) {
//         fs.readFile(p, (err, fileContent) => {
//             if (err) {
//                 return;
//             }
//             const updatedCart = { ...JSON.parse(fileContent) };
//             const product = updatedCart.products.find(prod => { return prod.id === id });
//             if (!product) {
//                 return;
//             }
//             const productQty = product.qty;
//             updatedCart.products = updatedCart.products.filter(prod => { return prod.id !== id })
//             updatedCart.totalPrice = updatedCart.totalPrice - productPrice * productQty;
//             fs.writeFile(p, JSON.stringify(updatedCart), err => {
//                 console.log(err);
//             });
//         });
//     }

//     static getCart(cb) {
//         fs.readFile(p, (err, fileContent) => {
//             const cart = JSON.parse(fileContent);
//             if (err) {
//                 cb(null);
//             } else {
//                 cb(cart);
//             }
//         })
//     }
// }

const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Cart = sequelize.define('cart', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    }
});

module.exports = Cart;

//on rajoute un model CartItem car le model Cart contient tous les carts de chaque user