const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        docTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title; // req.body.["name" field dans l'input du form]
    const imageUrl = req.body.imageUrl;
    const price = req.body.price;
    const description = req.body.description;
    req.user.createProduct({ // createProduct est une methode automatiquement creee par Sequelize quand on fait la relation user.hasMany(Product) (app.js)
        title: title,
        price: price,
        imageUrl: imageUrl,
        description: description
    })
        .then(() => {
            res.redirect('/admin/products');
        })
        .catch();
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit; // req.query.edit correspond a la query edit=... (chaque "?" est une query) localhost:3000/admin/edit-product/:id?param1=...?edit=...?param3=... etc...
    if (!editMode) {
        return res.redirect('/');
    }
    const prodId = req.params.productId;
    req.user.getProducts({ where: { id: prodId } }) // sequelize methode
    // Product.findByPk(prodId)
        .then(products => {
            const product = products[0];
            if (!product) {
                return res.redirect('/');
            }
            res.render('admin/edit-product', {
                docTitle: 'Edit Product',
                path: '/admin/edit-product',
                editing: editMode,
                product: product
            });
        });
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const updatedImageUrl = req.body.imageUrl;
    const updatedDesc = req.body.description;
    Product.findByPk(prodId)
        .then(product => {
            product.title = updatedTitle;
            product.price = updatedPrice;
            product.description = updatedDesc;
            product.imageUrl = updatedImageUrl;
            return product.save(); // sequelize method
        })
        .then(() => {
            res.redirect('/admin/products');
        })
        .catch();
};

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findByPk(prodId)
        .then(product => {
            return product.destroy();
        })
        .then(() => {
            res.redirect('/admin/products');
        })
        .catch();
};

exports.getProducts = (req, res, next) => {
    // Product.fetchAll(products => {
    //     res.render('admin/products', {
    //         prods: products,
    //         docTitle: 'Admin Products',
    //         path: '/admin/products'
    //     });
    // });
    // Product.findAll()
    req.user.getProducts()
        .then(products => {
            res.render('admin/products', {
                prods: products,
                docTitle: 'Admin Products',
                path: '/admin/products'
            });
        })
        .catch();
};