const User = require('../models/user');

exports.getLogin = (req, res, next) => {
    res.render('auth/login', {
        docTitle: 'Login',
        path: '/login',
        isAuth: req.session.isLoggedIn
    });
};

exports.postLogin = (req, res, next) => {
    // res.setHeader('Set-Cookie', 'loggedIn=true'); // permet de set un cookie. Dans Google Chrome voir 'Inspecter', onglet 'Application', et a gauche aller dans Cookies et voir la valeur loggedIn sera a true
    User.findById('60f59894c593a455281d157b')
        .then(user => {
            req.session.isLoggedIn = true;
            req.session.user = user;
            req.session.save(() => { // il n'est pas necessaire d'utiliser save() pour une session mais dans ce cas ci on redirect 'trop vite' car ca prend un certain temps a la base de donnees pour creer la session. En faisant save() on est sûrs de redirect apres que la session ait été créée (ca evite de devoir actualiser la page pour voir les changements)
                res.redirect('/');
            });
        })
        .catch();
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
};
