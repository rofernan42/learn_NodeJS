const Product = require('../models/product');
const Order = require('../models/order');

exports.getProducts = (req, res, next) => {
    Product.find()
        .then(products => {
            res.render('shop/product-list', {
                prods: products,
                docTitle: 'All Products',
                path: '/products',
                isAuth: req.session.isLoggedIn
            });
        })
        .catch();
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId; // meme nom de variable que dans la route /products/:productId (fichier routes/shop.js)
    Product.findById(prodId) // findById provided by Mongoose
        .then(product => {
            res.render('shop/product-detail', {
                product: product,
                docTitle: product.title,
                path: '/products',
                isAuth: req.session.isLoggedIn
            });
        })
        .catch();
};

exports.getIndex = (req, res, next) => {
    Product.find()
        .then(products => {
            res.render('shop/index', {
                prods: products,
                docTitle: 'Shop',
                path: '/',
                isAuth: req.session.isLoggedIn
            });
        })
        .catch();
};

exports.getCart = (req, res, next) => {
    req.user.populate('cart.items.productId')
        .execPopulate() // fonction pour obtenir une promise de populate() pour pouvoir utiliser then()
        .then(user => {
            const products = user.cart.items;
            res.render('shop/cart', {
                path: '/cart',
                docTitle: 'Your Cart',
                products: products,
                isAuth: req.session.isLoggedIn
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
    req.user.populate('cart.items.productId')
        .execPopulate() // fonction pour obtenir une promise de populate() pour pouvoir utiliser then()
        .then(user => {
            const products = user.cart.items.map(i => {
                return { quantity: i.quantity, product: { ...i.productId._doc } }; // i.productId contient plein de metadatas et _doc permet de retirer les informations liees au product correspondant. Avec {...i.productId._doc} on extrait toutes les infos du product pour les mettres dans un objet
            });
            const order = new Order({
                user: {
                    name: req.user.name,
                    userId: req.user // on peut mettre tout l'objet et mongoose va selectionner le _id automatiquement
                },
                products: products
            });
            return order.save();
        })
        .then(() => {
            return req.user.clearCart();
        })
        .then(() => {
            res.redirect('/orders');
        })
        .catch()
};

exports.getOrders = (req, res, next) => {
    Order.find({ 'user.userId': req.user._id })
        .then(orders => {
            res.render('shop/orders', {
                path: '/orders',
                docTitle: 'Your Orders',
                orders: orders,
                isAuth: req.session.isLoggedIn
            });
        })
        .catch();
};

exports.postCartDelete = (req, res, next) => {
    const prodId = req.body.productId;
    req.user.removeFromCart(prodId)
        .then(() => {
            res.redirect('/cart');
        })
        .catch();
};