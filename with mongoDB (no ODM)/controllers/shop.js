const Product = require('../models/product');

exports.getProducts = (req, res, next) => {
    Product.fetchAll()
        .then(products => {
            res.render('shop/product-list', {
                prods: products,
                docTitle: 'All Products',
                path: '/products'
            });
        })
        .catch();
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId; // meme nom de variable que dans la route /products/:productId (fichier routes/shop.js)
    Product.findById(prodId)
        .then(product => {
            res.render('shop/product-detail', {
                product: product,
                docTitle: product.title,
                path: '/products'
            });
        })
        .catch();
};

exports.getIndex = (req, res, next) => {
    Product.fetchAll()
        .then(products => {
            res.render('shop/index', {
                prods: products,
                docTitle: 'Shop',
                path: '/'
            });
        })
        .catch();
};

exports.getCart = (req, res, next) => {
    req.user.getCart()
        .then(products => {
            res.render('shop/cart', {
                path: '/cart',
                docTitle: 'Your Cart',
                products: products
            });
        })
        .catch()
};

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
        .then(product => {
            return req.user.addToCart(product);
        })
        .then(() => {
            res.redirect('/cart');
        })
        .catch();
};

exports.postOrder = (req, res, next) => {
    req.user.addOrder()
        .then(() => {
            res.redirect('/orders');
        })
        .catch()
};

exports.getOrders = (req, res, next) => {
    req.user.getOrders()
        .then(orders => {
            res.render('shop/orders', {
                path: '/orders',
                docTitle: 'Your Orders',
                orders: orders
            });
        })
        .catch();
};

// exports.getCheckout = (req, res, next) => {
//     res.render('shop/checkout', {
//         path: '/checkout',
//         docTitle: 'Checkout'
//     });
// };

exports.postCartDelete = (req, res, next) => {
    const prodId = req.body.productId;
    req.user.deleteItemFromCart(prodId)
        .then(() => {
            res.redirect('/cart');
        })
        .catch();
};