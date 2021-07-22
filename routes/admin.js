const path = require('path');

const express = require('express');

const adminController = require('../controllers/admin');

const router = express.Router();

const isAuth = require('../middleware/is-auth');

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);
// execute les middlewares de gauche a droite: isAuth en premier, puis si next() est atteint (si req.session.isLoggedIn == true), va executer adminController.getAddProduct

// /admin/add-product => POST
router.post('/add-product', isAuth, adminController.postAddProduct);

// /admin/edit-product/:id => GET
router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', isAuth, adminController.postEditProduct);

router.post('/delete-product', isAuth, adminController.postDeleteProduct);

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

module.exports = router;
