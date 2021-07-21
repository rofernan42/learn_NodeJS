const Product = require('../models/product');

exports.getProducts = (req, res, next) => {
    Product.findAll()
        .then(products => {
            res.render('shop/product-list', {
                prods: products,
                docTitle: 'All Products',
                path: '/products'
            });
        })
        .catch(); //findAll est une methode de sequelize

    // Product.fetchAll()
    // .then(([rows, fieldData]) => {
    //     res.render('shop/product-list', {
    //         prods: rows,
    //         docTitle: 'All Products',
    //         path: '/products'
    //     });
    // })
    // .catch();
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId; // meme nom de variable que dans la route /products/:productId (fichier routes/shop.js)
    Product.findByPk(prodId)
        .then(product => {
            res.render('shop/product-detail', {
                product: product,
                docTitle: product.title,
                path: '/products'
            });
        })
        .catch(); // findByPk() = findById() pour sequelize

    //alternative:
    // Product.findAll({where: { id: prodId } })
    // .then(products => {
    //     res.render('shop/product-detail', {
    //         product: products[0],
    //         docTitle: products[0].title,
    //         path: '/products'
    //     });
    // })
    // .catch();
};

exports.getIndex = (req, res, next) => {
    Product.findAll()
        .then(products => {
            res.render('shop/index', {
                prods: products,
                docTitle: 'Shop',
                path: '/'
            });
        })
        .catch(); //findAll est une methode de sequelize

    // Product.fetchAll()
    // .then(([rows, fieldData]) => {
    // res.render('shop/index', {
    // prods: rows,
    // docTitle: 'Shop',
    // path: '/'
    // });
    // })
    // .catch(); // then et catch viennent de pool.promise() (/util/database.js)
};

exports.getCart = (req, res, next) => {
    // Cart.getCart(cart => {
    //     Product.fetchAll(products => {
    //         const cartProducts = [];
    //         for (product of products) {
    //             const cartProductData = cart.products.find(prod => { return prod.id === product.id })
    //             if (cartProductData) {
    //                 cartProducts.push({ productData: product, qty: cartProductData.qty });
    //             }
    //         }
    //         res.render('shop/cart', {
    //             path: '/cart',
    //             docTitle: 'Your Cart',
    //             products: cartProducts
    //         });
    //     });
    // });
    req.user.getCart()
        .then(cart => {
            return cart.getProducts() // getProducts: methode sequelize grace a l'association many to many entre cart et product
                .then(products => {
                    res.render('shop/cart', {
                        path: '/cart',
                        docTitle: 'Your Cart',
                        products: products
                    });
                })
                .catch()
        })
        .catch();
};

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    let fetchedCart; // variable utilisee pour avoir le cart dans le .then() du findByPk
    let newQuantity = 1;
    req.user.getCart()
        .then(cart => {
            fetchedCart = cart;
            return cart.getProducts({ where: { id: prodId } });
        })
        .then(products => {
            let product;
            if (products.length > 0)
                product = products[0];
            if (product) {
                const oldQty = product.cartItem.quantity;
                newQuantity = oldQty + 1;
                return product;
            }
            return Product.findByPk(prodId)
        })
        .then(product => {
            return fetchedCart.addProduct(product, { through: { quantity: newQuantity } }); // addProduct: methode Sequelize grace a la many to many association
        })
        .then(() => {
            res.redirect('/cart');
        })
        .catch();
};

exports.postOrder = (req, res, next) => {
    let fetchedCart;
    req.user.getCart()
        .then(cart => {
            fetchedCart = cart;
            return cart.getProducts();
        })
        .then(products => {
            return req.user.createOrder()
                .then(order => {
                    return order.addProducts(products.map(product => {
                        product.orderItem = { quantity: product.cartItem.quantity };
                        return product;
                    }));
                })
                .catch();
        })
        .then(() => {
            return fetchedCart.setProducts(null);
        })
        .then(() => {
            res.redirect('/orders');
        })
        .catch()
};

exports.getOrders = (req, res, next) => {
    req.user.getOrders({ include: ['products'] })
        .then(orders => {
            res.render('shop/orders', {
                path: '/orders',
                docTitle: 'Your Orders',
                orders: orders
            });
        })
        .catch();
};

exports.getCheckout = (req, res, next) => {
    res.render('shop/checkout', {
        path: '/checkout',
        docTitle: 'Checkout'
    });
};

exports.postCartDelete = (req, res, next) => {
    const prodId = req.body.productId;
    req.user.getCart()
        .then(cart => {
            return cart.getProducts({ where: { id: prodId } });
        })
        .then(products => {
            const product = products[0];
            return product.cartItem.destroy();
        })
        .then(() => {
            res.redirect('/cart');
        })
        .catch();
};