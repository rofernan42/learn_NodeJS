const mongodb = require('mongodb');
const getDb = require('../util/database').getDb;

class User {
    constructor(username, email, cart, id) {
        this.name = username;
        this.email = email;
        this.cart = cart; // {items: []}
        this._id = id;
    }

    save() {
        const db = getDb();
        return db.collection('users').insertOne(this);
    }

    addToCart(product) {
        const cartProductIndex = this.cart.items.findIndex(cp => {
            return cp.productId.toString() === product._id.toString();
        });
        let newQty = 1;
        const updatedCartItems = [...this.cart.items];

        if (cartProductIndex >= 0) { // findIndex renvoie -1 s'il ne trouve aucun element correspondant au callback
            newQty = this.cart.items[cartProductIndex].quantity + 1;
            updatedCartItems[cartProductIndex].quantity = newQty;
        } else {
            updatedCartItems.push({ productId: new mongodb.ObjectId(product._id), quantity: newQty })
        }
        const updatedCart = { items: updatedCartItems };
        const db = getDb();
        return db.collection('users').updateOne(
            { _id: new mongodb.ObjectId(this._id) },
            { $set: { cart: updatedCart } }
        );
    }

    getCart() {
        const db = getDb();
        const productIds = this.cart.items.map(i => {  // on map productIds avec juste le productId de cart.items (pas besoin du quantity)
            return i.productId;
        });
        return db.collection('products').find({ _id: { $in: productIds } }).toArray()  // $in : mongodb query operator (voir doc) -> avec find(): va renvoyer un tableau avec tous les _id qui matchent les ids dans productIds
            .then(products => {
                return products.map(p => {
                    return {
                        ...p,
                        quantity: this.cart.items.find(i => { return i.productId.toString() === p._id.toString() }).quantity
                    };
                });
            });
    }

    deleteItemFromCart(prodId) {
        const updatedCartItems = this.cart.items.filter(item => {
            return item.productId.toString() !== prodId.toString();
        });
        const db = getDb();
        return db.collection('users').updateOne(
            { _id: new mongodb.ObjectId(this._id) },
            { $set: { cart: { items: updatedCartItems } } }
        );
    }

    addOrder() {
        const db = getDb();
        return this.getCart()
            .then(products => {
                const order = {
                    items: products,
                    user: {
                        _id: new mongodb.ObjectId(this._id),
                        name: this.name
                    }
                };
                return db.collection('orders').insertOne(order);
            })
            .then(res => {
                this.cart = { item: [] };
                return db.collection('users').updateOne(
                    { _id: new mongodb.ObjectId(this._id) },
                    { $set: { cart: { items: [] } } }
                );
            });
    }

    getOrders() {
        const db = getDb();
        return db.collection('orders').find({ 'user._id': new mongodb.ObjectId(this._id) }).toArray();
    }

    static findById(userId) {
        const db = getDb();
        return db.collection('users').find({ _id: new mongodb.ObjectId(userId) }).next()
        // alternative: return db.collection('users').findOne({ _id: new mongodb.ObjectId(userId) });
    }
}

module.exports = User;