const User = require('../models/user');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const crypto = require('crypto') // module de nodeJS qui permet de creer des valeurs random et uniques

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
        errorMessage: message
    });
};

exports.postLogin = (req, res, next) => {
    // res.setHeader('Set-Cookie', 'loggedIn=true'); // permet de set un cookie. Dans Google Chrome voir 'Inspecter', onglet 'Application', et a gauche aller dans Cookies et voir la valeur loggedIn sera a true
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                req.flash('error', 'Invalid email or password.'); // flash() method from connect-flash package. Stock le message dans la variable 'error'
                return res.redirect('/login');
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
                    req.flash('error', 'Invalid email or password.');
                    res.redirect('/login');
                })
                .catch(() => {
                    res.redirect('/login');
                });
        })
        .catch();
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
        errorMessage: message
    });
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPwd = req.body.confirmPassword;
    User.findOne({ email: email })
        .then(userDoc => {
            if (userDoc) {
                req.flash('error', 'E-Mail already exists, please pick a different one.');
                return res.redirect('/signup');
            }
            return bcrypt.hash(password, 12)
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
                });
        })
        .catch();
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
            .catch();
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
        .catch()
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
        .catch();
};