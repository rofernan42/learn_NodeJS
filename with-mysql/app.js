const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const errorController = require('./controllers/error')

const sequelize = require('./util/database');
const Product = require('./models/product');
const User = require('./models/user');
const Cart = require('./models/cart');
const CartItem = require('./models/cart-item');
const Order = require('./models/order');
const OrderItem = require('./models/order-item');

const app = express();

// Use Handlebars templates
// const expressHbs = require('express-handlebars');
// app.engine('hbs', expressHbs({
//     layoutsDir: 'views/layouts/',
//     defaultLayout: 'main-layout',
//     extname: 'hbs'})); // hbs sera le npm de l'extension des fichiers templates (fichier.hbs) (si c'etait "handlebars", les fichiers seraient du type fichier.handlebars)
// app.set('view engine', 'hbs');

// Use pug templates
// app.set('view engine', 'pug');

// Use ejs templates
app.set('view engine', 'ejs');

app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public'))); //permet de chercher un chemin de fichier static (pour linker les fichiers css par ex)

// middleware for storing the user in the request so we can use it anywhere in the app
app.use((req, res, next) => {
    User.findByPk(1)
        .then(user => {
            req.user = user;
            next();
        })
        .catch();
});

app.use('/admin', adminRoutes); //toutes les routes dans amin.js commenceront par /admin
app.use(shopRoutes);

app.use(errorController.get404);

// associations
Product.belongsTo(User, { constraints: true, onDelete: 'CASCADE' });
User.hasMany(Product);
User.hasOne(Cart);
Cart.belongsTo(User); // optionnel (le hasOne suffit)
Cart.belongsToMany(Product, { through: CartItem });
Product.belongsToMany(Cart, { through: CartItem }); // many to many association: un Cart peut avoir plusieurs Products et un Product peut etre dans plusieurs Cart
Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Product, { through: OrderItem });

sequelize
    // .sync({ force: true }) // force: true -> overwrite the database
    .sync()
    .then(res => {
        return User.findByPk(1);
    })
    .then(user => {
        if (!user) {
            return User.create({ name: 'Romain', email: 'romain@mail.com' });
        }
        return user;
    })
    .then((user) => {
        return user.createCart();
    })
    .then((cart) => {
        app.listen(3000);
    })
    .catch();
