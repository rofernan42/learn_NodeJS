const express = require('express');

const authController = require('../controllers/auth');

const router = express.Router();

const { check, body } = require('express-validator/check');

const User = require('../models/user');

router.get('/login', authController.getLogin);

router.post('/login',
    body('email').normalizeEmail(), // normalizeEmail(): sanitizer (met tout en lower case, enleve les whitespace, etc.)
    body('password').trim(), // trim(): sanitizer aussi
    authController.postLogin);

router.get('/signup', authController.getSignup);

router.post('/signup',
    check('email')
        .isEmail()
        .withMessage('Please enter a valid email.')
        .custom((value, { req }) => {
            return User.findOne({ email: value })
                .then(userDoc => {
                    if (userDoc) {
                        return Promise.reject('E-Mail already exists, please pick a different one.');
                    }
                })
        })
        .normalizeEmail(),
    body('password', 'Please enter a password with only numbers and text and at least 5 characters.') //lorsque le message d'erreur est passé en 2nd argument, c'est le message par defaut (au lieu de 'invalid value') (ca evite de faire un withMessage() apres chaque validation)
        .isLength({ min: 5 })
        .isAlphanumeric()
        .trim(),
    body('confirmPassword')
        .trim()
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords have to match.');
            }
            return true;
        }),
    authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;