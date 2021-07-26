const Product = require('../models/product');
const Order = require('../models/order');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const ITEMS_PER_PAGE = 2;

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1; // le + sert a parser req.query.page en tant que int et non une string; le || 1 sert quand il n'y a pas de query param pour pas qu'il y ait de bug a l'affichage
    let totalItems;

    Product.find().countDocuments()
        .then(nbProd => {
            totalItems = nbProd;
            return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE) // mongodb function, on l'utilise ici pour la pagination
                .limit(ITEMS_PER_PAGE)
        })
        .then(products => {
            res.render('shop/product-list', {
                prods: products,
                docTitle: 'All Products',
                path: '/products',
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId; // meme nom de variable que dans la route /products/:productId (fichier routes/shop.js)
    Product.findById(prodId) // findById provided by Mongoose
        .then(product => {
            res.render('shop/product-detail', {
                product: product,
                docTitle: product.title,
                path: '/products',
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getIndex = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;

    Product.find().countDocuments()
        .then(nbProd => {
            totalItems = nbProd;
            return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE) // mongodb function, on l'utilise ici pour la pagination
                .limit(ITEMS_PER_PAGE)
        })
        .then(products => {
            res.render('shop/index', {
                prods: products,
                docTitle: 'Shop',
                path: '/',
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getCart = (req, res, next) => {
    req.user.populate('cart.items.productId') // populate sert a remplacer le path cart.items.productId par les objets de Product correspondants. C'est le champ "ref: 'Product'" dans le User model qui permet de faire le lien
        .execPopulate() // fonction pour obtenir une promise de populate() pour pouvoir utiliser then()
        .then(user => {
            const products = user.cart.items;
            res.render('shop/cart', {
                path: '/cart',
                docTitle: 'Your Cart',
                products: products,
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
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
                    email: req.user.email,
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

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    Order.findById(orderId)
        .then(order => {
            if (!order) {
                return next(new Error('No order found.'));
            }
            if (order.user.userId.toString() !== req.user._id.toString()) {
                return next(new Error('Unauthorized.'));
            }
            const invoiceName = 'invoice-' + orderId + '.pdf';
            const invoicePath = path.join('data', 'invoices', invoiceName);

            const pdfDoc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
            pdfDoc.pipe(fs.createWriteStream(invoicePath));
            pdfDoc.pipe(res);

            pdfDoc.fontSize(26).text('Invoice', { underline: true });
            pdfDoc.text('-----------------------------------------');
            let totalPrice = 0;
            order.products.forEach(prod => {
                totalPrice += prod.quantity * prod.product.price;
                pdfDoc.fontSize(14).text(prod.product.title + ' - ' + prod.quantity + ' x $' + prod.product.price);
            });
            pdfDoc.text('__________________________');
            pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);

            pdfDoc.end();

            // fs.readFile(invoicePath, (err, data) => {    // pas optimal pour les gros fichiers
            //     if (err) {
            //         return next(err);
            //     }
            //     res.setHeader('Content-Type', 'application/pdf');
            //     res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
            //     res.send(data);
            // });

            // const file = fs.createReadStream(invoicePath); // permet de streamer des fichiers (meilleur en cas de gros fichiers)
            // res.setHeader('Content-Type', 'application/pdf');
            // res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
            // file.pipe(res);
        })
        .catch(err => next(err));
};

exports.getCheckout = (req, res, next) => {
    let products;
    let total = 0;
    req.user.populate('cart.items.productId')
        .execPopulate() // fonction pour obtenir une promise de populate() pour pouvoir utiliser then()
        .then(user => {
            products = user.cart.items;
            total = 0;
            products.forEach(p => {
                total += p.quantity * p.productId.price;
            })
            res.render('shop/checkout', {
                path: '/checkout',
                docTitle: 'Checkout',
                products: products,
                totalSum: total
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};