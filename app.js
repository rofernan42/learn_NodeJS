const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');

const errorController = require('./controllers/error')

const User = require('./models/user');

const MONGODB_URI = 'mongodb+srv://romain:LUJODAVfeltMTpKv@cluster0.ub4t7.mongodb.net/shop?retryWrites=true&w=majority'

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
}); // va creer une table 'sessions' dans la db

const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        const dateStr = new Date().toISOString().replace(/:/g, '-')
        cb(null, dateStr + '-' + file.originalname)
    }
}); // https://github.com/expressjs/multer#diskstorage

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}; // https://github.com/expressjs/multer#filefilter

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

// app.use(bodyParser.urlencoded({ extended: false })); // deprecated
app.use(express.urlencoded({ extended: true }));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')); // 'image' est la valeur du champ 'name' de l'input du form dans edit-product.ejs

app.use(express.static(path.join(__dirname, 'public'))); //permet de chercher un chemin de fichier static (pour linker les fichiers css par ex)
app.use('/images', express.static(path.join(__dirname, 'images'))); // le premier arg '/images' sert a faire en sorte que le chemin des images soit localhost:3000/image.png au lieu de localhost:3000/images/image.png (l'image ne s'affiche pas dans ce cas la)

app.use(session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
}));

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
    res.locals.isAuth = req.session.isLoggedIn; // req.locals: variable locales pour chaque vue
    res.locals.csrfToken = req.csrfToken() // method provided by the csrf middleware
    next();
}); // pour toutes les requetes faites, ce middleware sera executé (verif si on est logged in et csrf token)

// middleware for storing the user in the request so we can use it anywhere in the app
app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then(user => {
            if (!user) {
                return next();
            }
            req.user = user;
            next();
        })
        .catch((err) => {
            next(new Error(err));
        });
});

app.use('/admin', adminRoutes); //toutes les routes dans amin.js commenceront par /admin
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);
app.use((error, req, res, next) => {
    res.status(500).render('500', {
        docTitle: 'Error',
        path: '/500',
        isAuth: true
    });
})
app.use(errorController.get404);

mongoose.connect(MONGODB_URI)
    .then(() => {
        app.listen(3000);
    });