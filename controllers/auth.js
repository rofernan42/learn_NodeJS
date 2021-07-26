const User = require('../models/user');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const crypto = require('crypto') // module de nodeJS qui permet de creer des valeurs random et uniques
const { validationResult } = require('express-validator/check')

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: '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'
    } // api key créée sur le site sendgrid (Settings -> API Keys) (name: learn-nodejs)
}));

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0]
    } else {
        message = null;
    }
    res.render('auth/login', {
        docTitle: 'Login',
        path: '/login',
        errorMessage: message,
        oldInput: { email: '', password: '' },
        validationErrors: []
    });
};

exports.postLogin = (req, res, next) => {
    // res.setHeader('Set-Cookie', 'loggedIn=true'); // permet de set un cookie. Dans Google Chrome voir 'Inspecter', onglet 'Application', et a gauche aller dans Cookies et voir la valeur loggedIn sera a true
    const email = req.body.email;
    const password = req.body.password;

    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //     return res.status(422).render('auth/login', {
    //         docTitle: 'Login',
    //         path: '/login',
    //         errorMessage: errors.array()[0].msg,
    //         oldInput: { email: email, password: password },
    //         validationErrors: errors.array()
    //     });
    // }
    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                return res.status(422).render('auth/login', {
                    docTitle: 'Login',
                    path: '/login',
                    errorMessage: 'Invalid email or password.',
                    oldInput: { email: email, password: password },
                    validationErrors: [{ param: 'email' }]
                });
            }
            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save(() => { // il n'est pas necessaire d'utiliser save() pour une session mais dans ce cas ci on redirect 'trop vite' car ca prend un certain temps a la base de donnees pour creer la session. En faisant save() on est sûrs de redirect apres que la session ait été créée (ca evite de devoir actualiser la page pour voir les changements)
                            res.redirect('/');
                        });
                    }
                    return res.status(422).render('auth/login', {
                        docTitle: 'Login',
                        path: '/login',
                        errorMessage: 'Invalid email or password.',
                        oldInput: { email: email, password: password },
                        validationErrors: [{ param: 'password' }]
                    });
                })
                .catch(() => {
                    res.redirect('/login');
                });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0]
    } else {
        message = null;
    }
    res.render('auth/signup', {
        docTitle: 'Signup',
        path: '/signup',
        errorMessage: message,
        oldInput: { email: '', password: '' },
        validationErrors: []
    });
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/signup', {
            docTitle: 'Signup',
            path: '/signup',
            errorMessage: errors.array()[0].msg,
            oldInput: { email: email, password: password },
            validationErrors: errors.array()
        });
    }
    bcrypt.hash(password, 12)
        .then(hashPassword => {
            const user = new User({
                email: email,
                password: hashPassword,
                cart: { items: [] }
            });
            return user.save();
        })
        .then(() => {
            res.redirect('/login');
            return transporter.sendMail({
                to: email,
                from: 'romain.fndz42@gmail.com',
                subject: 'Signup succeeded',
                html: '<h1>You succeded signing up!</h1>'
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
};

exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0]
    } else {
        message = null;
    }
    res.render('auth/reset', {
        docTitle: 'Reset Password',
        path: '/reset',
        errorMessage: message
    });
};

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    req.flash('error', 'No account with that E-Mail found.');
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000; // token valable pour 1h
                return user.save();
            })
            .then(() => {
                res.redirect('/');
                transporter.sendMail({
                    to: req.body.email,
                    from: 'romain.fndz42@gmail.com',
                    subject: 'Password reset',
                    html: `
                        <h1>You requested a password reset</h1>
                        <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
                    `
                });
            })
            .catch((err) => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    });
};

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
        .then(user => {
            let message = req.flash('error');
            if (message.length > 0) {
                message = message[0]
            } else {
                message = null;
            }
            res.render('auth/new-password', {
                docTitle: 'New Password',
                path: '/new-password',
                errorMessage: message,
                userId: user._id.toString(), //utilisé pour le postNewPassword mais aussi dans le cas oú on tape /reset/randomtoken on accede pas a la page si on n'est pass connecté car il trouvera pas userId
                passwordToken: token
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;

    User.findOne({
        resetToken: passwordToken,
        resetTokenExpiration: { $gt: Date.now() },
        _id: userId
    })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save();
        })
        .then(() => {
            res.redirect('/login');
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};