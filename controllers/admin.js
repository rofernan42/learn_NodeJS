const Product = require('../models/product');
const { validationResult } = require('express-validator/check');
const fileHelper = require('../util/file');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        docTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: []
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title; // req.body.["name" field dans l'input du form]
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;

    if (!image) {
        return res.status(422).render('admin/edit-product', {
            docTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            product: { title: title, price: price, description: description },
            errorMessage: 'Attached file is of the wrong type.',
            validationErrors: []
        });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            docTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            product: { title: title, price: price, description: description },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }

    const imageUrl = image.path;

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
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error); // next avec une erreur en argument va skip tous les middleware et aller directement a un middleware de gestion d'erreur (dans app.js: app.use((error, req, res, next) => {}))
        });
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
                hasError: false,
                errorMessage: null,
                validationErrors: []
            });
        });
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const image = req.file;
    const updatedDesc = req.body.description;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            docTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: true,
            hasError: true,
            product: { title: updatedTitle, price: updatedPrice, description: updatedDesc, _id: prodId },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }

    Product.findById(prodId)
        .then(product => {
            if (product.userId.toString() !== req.user._id.toString()) { // on checke si le current user est le createur du product
                return res.redirect('/');
            }
            product.title = updatedTitle;
            product.price = updatedPrice;
            product.description = updatedDesc;
            if (image) {
                fileHelper.deleteFile(product.imageUrl);
                product.imageUrl = image.path;
            }
            return product.save()
                .then(() => {
                    res.redirect('/admin/products');
                });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.deleteProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return next(new Error('Product not found.'));
            }
            fileHelper.deleteFile(product.imageUrl);
            return Product.deleteOne({ _id: prodId, userId: req.user._id });
        })
        .then(() => {
            res.status(200).json({ message: 'Success' });
        })
        .catch((err) => {
            res.status(500).json({ message: 'Deleting product failed.' });
        });
};

exports.getProducts = (req, res, next) => {
    Product.find({ userId: req.user._id })
        // .select('title price -_id') // permet de selectionner uniquement certains attributs, et explicitement en eliminer (avec le - devant)
        // .populate('userId', 'name')
        .then(products => {
            res.render('admin/products', {
                prods: products,
                docTitle: 'Admin Products',
                path: '/admin/products',
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};