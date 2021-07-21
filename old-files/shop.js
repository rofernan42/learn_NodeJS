const path = require('path');

const express = require('express');

const rootDir = require('../util/path');
const adminData = require('./admin');

const router = express.Router();

router.get('/', (req, res, next) => {
    const products = adminData.products;

    res.render('shop', {
        prods: products,
        docTitle: 'Shop',
        path: '/'
    }); // render le template shop.pug ou shop.ejs

    // res.render('shop', {
    //     prods: products,
    //     docTitle: 'Shop',
    //     path: '/',
    //     hasProducts: products.length > 0,
    //     activeShop: true,
    //     productCSS: true
    // }); // pour le template shop.hbs

    // res.sendFile(path.join(rootDir, 'views', 'shop.html'));
    // ~ res.sendFile(path.join(__dirname, '..', 'views', 'shop.html'));   __dirname est une variable globale qui stocke le chemin absolu du projet
});

module.exports = router;