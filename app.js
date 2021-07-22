const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');

const errorController = require('./controllers/error')

const User = require('./models/user');

const MONGODB_URI = 'mongodb+srv://romain:LUJODAVfeltMTpKv@cluster0.ub4t7.mongodb.net/shop?retryWrites=true&w=majority'

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
}); // va creer une table 'sessions' dans la db

const csrfProtection = csrf();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public'))); //permet de chercher un chemin de fichier static (pour linker les fichiers css par ex)
app.use(session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
}));

app.use(csrfProtection);
app.use(flash());

// middleware for storing the user in the request so we can use it anywhere in the app
app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then(user => {
            req.user = user;
            next();
        })
        .catch();
});

app.use((req, res, next) => {
    res.locals.isAuth = req.session.isLoggedIn; // req.locals: variable locales pour chaque vue
    res.locals.csrfToken = req.csrfToken() // method provided by the csrf middleware
    next();
}); // pour toutes les requetes faites, ce middleware sera executé (verif si on est logged in et csrf token)

app.use('/admin', adminRoutes); //toutes les routes dans amin.js commenceront par /admin
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose.connect(MONGODB_URI)
    .then(() => {
        app.listen(3000);
    });