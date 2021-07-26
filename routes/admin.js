const path = require('path');

const express = require('express');

const adminController = require('../controllers/admin');

const router = express.Router();

const isAuth = require('../middleware/is-auth');

const { body } = require('express-validator/check');

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);
// execute les middlewares de gauche a droite: isAuth en premier, puis si next() est atteint (si req.session.isLoggedIn == true), va executer adminController.getAddProduct

// /admin/add-product => POST
router.post('/add-product',
    body('title')
        .isString()
        .isLength({ min: 3 })
        .trim(),
    body('price')
        .isFloat(),
    body('description')
        .isLength({ min: 5, max: 200 })
        .trim(),
    isAuth, adminController.postAddProduct);

// /admin/edit-product/:id => GET
router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product',
    body('title')
        .isString()
        .isLength({ min: 3 })
        .trim(),
    body('price')
        .isFloat(),
    body('description')
        .isLength({ min: 5, max: 200 })
        .trim(),
    isAuth, adminController.postEditProduct);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

module.exports = router;
