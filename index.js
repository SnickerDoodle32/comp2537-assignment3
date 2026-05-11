require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const path = require('path');

const app = express();
const port = process.env.PORT || 3018;

let db;
let usersCollection;

const client = new MongoClient(process.env.DBUrl);

async function connectDB() {
    await client.connect();
    db = db || client.db(process.env.DBName);
    usersCollection = db.collection('users');
    console.log('Connected to MongoDB');
}

const userSchema = Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }).required(),
    password: Joi.string().min(6).required(),
    user_type: Joi.string().valid('user', 'admin').default('user')
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: process.env.SessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 }
}));

app.use(async (req, res, next) => {
    try {
        await connectDB();
    } catch (e) {
        console.error('DB connection error:', e);
    }
    next();
});

function isLoggedIn(req) {
    return req.session && req.session.userId;
}

function isAdmin(req) {
    return req.session && req.session.userType === 'admin';
}

app.get('/', (req, res) => {
    res.render('index', { loggedIn: req.session.userId ? true : false, userType: req.session.userType });
});

app.get('/signup', (req, res) => {
    res.render('signup', { error: null, loggedIn: req.session.userId ? true : false });
});

app.post('/signup', async (req, res) => {
    const { error, value } = userSchema.validate(req.body);
    if (error) {
        return res.render('signup', { error: error.details[0].message, loggedIn: req.session.userId ? true : false });
    }

    const { email, password, user_type } = value;

    try {
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return res.render('signup', { error: 'Email already exists', loggedIn: req.session.userId ? true : false });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await usersCollection.insertOne({
            email,
            password: hashedPassword,
            user_type: user_type || 'user'
        });

        res.redirect('/login');
    } catch (e) {
        res.render('signup', { error: 'Error creating user', loggedIn: req.session.userId ? true : false });
    }
});

app.get('/login', (req, res) => {
    res.render('login', { error: null, loggedIn: req.session.userId ? true : false });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await usersCollection.findOne({ email });
        if (!user) {
            return res.render('login', { error: 'Invalid email or password', loggedIn: req.session.userId ? true : false });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.render('login', { error: 'Invalid email or password', loggedIn: req.session.userId ? true : false });
        }

        req.session.userId = user._id.toString();
        req.session.email = user.email;
        req.session.userType = user.user_type;

        res.redirect('/');
    } catch (e) {
        res.render('login', { error: 'Error logging in', loggedIn: req.session.userId ? true : false });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/members', (req, res) => {
    if (!isLoggedIn(req)) {
        return res.redirect('/login');
    }
    res.render('members', { email: req.session.email, loggedIn: req.session.userId ? true : false });
});

app.get('/admin', async (req, res) => {
    if (!isLoggedIn(req)) {
        return res.redirect('/login');
    }
    if (!isAdmin(req)) {
        return res.status(403).render('404', { loggedIn: true });
    }

    const users = await usersCollection.find().toArray();
    res.render('admin', { users, currentUserId: req.session.userId, loggedIn: req.session.userId ? true : false });
});

app.post('/admin/promote', async (req, res) => {
    if (!isLoggedIn(req) || !isAdmin(req)) {
        return res.redirect('/login');
    }

    const { userId } = req.body;
    await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { user_type: 'admin' } }
    );
    res.redirect('/admin');
});

app.post('/admin/demote', async (req, res) => {
    if (!isLoggedIn(req) || !isAdmin(req)) {
        return res.redirect('/login');
    }

    const { userId } = req.body;
    await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { user_type: 'user' } }
    );
    res.redirect('/admin');
});

app.use((req, res) => {
    res.status(404).render('404', { loggedIn: req.session.userId ? true : false });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

module.exports = app;