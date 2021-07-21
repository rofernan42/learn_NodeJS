const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const errorController = require('./controllers/error')

const User = require('./models/user');

const MONGODB_URI = 'mongodb+srv://romain:LUJODAVfeltMTpKv@cluster0.ub4t7.mongodb.net/shop?retryWrites=true&w=majority'

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
}); // va creer une table 'sessions' dans la db

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

app.use('/admin', adminRoutes); //toutes les routes dans amin.js commenceront par /admin
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose.connect(MONGODB_URI)
    .then(() => {
        User.findOne().then(user => {
            if (!user) {
                const user = new User({
                    name: 'Romain',
                    email: 'romain@mail.com',
                    cart: {
                        items: []
                    }
                });
                user.save();
            }
        });
    })
    .then(() => {
        app.listen(3000);
    });