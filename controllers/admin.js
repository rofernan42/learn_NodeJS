const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        docTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        isAuth: req.session.isLoggedIn
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title; // req.body.["name" field dans l'input du form]
    const imageUrl = req.body.imageUrl;
    const price = req.body.price;
    const description = req.body.description;
    const product = new Product({
        title: title,
        price: price,
        description: description,
        imageUrl: imageUrl,
        userId: req.user // on peut stocker tout l'objet user et Mongoose va automatiquement stocker le user._id
    });
    product.save() // save method provided by Mongoose
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
    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return res.redirect('/');
            }
            res.render('admin/edit-product', {
                docTitle: 'Edit Product',
                path: '/admin/edit-product',
                editing: editMode,
                product: product,
                isAuth: req.session.isLoggedIn
            });
        });
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const updatedImageUrl = req.body.imageUrl;
    const updatedDesc = req.body.description;

    Product.findById(prodId)
        .then(product => {
            product.title = updatedTitle;
            product.price = updatedPrice;
            product.description = updatedDesc;
            product.imageUrl = updatedImageUrl;
            return product.save();
        })
        .then(() => {
            res.redirect('/admin/products');
        })
        .catch();
};

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findByIdAndRemove(prodId) // method provided by Mongoose
        .then(() => {
            res.redirect('/admin/products');
        })
        .catch();
};

exports.getProducts = (req, res, next) => {
    Product.find()
        // .select('title price -_id') // permet de selectionner uniquement certains attributs, et explicitement en eliminer (avec le - devant)
        // .populate('userId', 'name')
        .then(products => {
            res.render('admin/products', {
                prods: products,
                docTitle: 'Admin Products',
                path: '/admin/products',
                isAuth: req.session.isLoggedIn
            });
        })
        .catch();
};