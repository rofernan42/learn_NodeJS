exports.get404 = (req, res, next) => {
    res.status(404).render('404', {
        docTitle: 'Page not found',
        path: '/404',
        isAuth: req.session.isLoggedIn
    });
};

exports.get500 = (req, res, next) => {
    res.status(500).render('500', {
        docTitle: 'Error',
        path: '/500',
        isAuth: req.session.isLoggedIn
    });
};