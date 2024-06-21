//npm init -y
//npm i express body-parser ejs
//npm i mongoose

import express from 'express';
import bodyParser from 'body-parser';
import ejs from 'ejs';
import mongoose from 'mongoose';
//npm i passport passport-local passport-local-mongoose express-session
import passport from 'passport';
import passportLocalMongoose from 'passport-local-mongoose';
import session from 'express-session';


const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'));

//place this code before mongoose.connect & after all other app.use
//for express-session 👇🏻:
app.use(session({
    //secret is a long string that will be stored in our .env file
    secret: 'Thisislongstring.',
    resave: false,                  //Forces the session to be saved back to the session store
    saveUninitialized: false,       //to implement login sessions
}));

//initialize passport 👇🏻
app.use(passport.initialize());
//also use passport to set up our session 👇🏻
app.use(passport.session());

//MONGODB DATABASE:
mongoose.connect("mongodb://127.0.0.1:27017/userdb")
    .then(function () {
        console.log('Connected to MongoDB');
    })
    .catch(function (err) {
        console.error('Error connecting to MongoDB:', err);
    });

//create schema as mongoose schema for LEVEL-2
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
});

//set up passport-local-mongoose as a plugin 👇🏻 to hash & salt passowrd  & save users to mongodb db
userSchema.plugin(passportLocalMongoose)

//create model
const User = mongoose.model("User", userSchema);

//passport-local-mongoose documentation  👇🏻

passport.use(User.createStrategy());                // create Strategy
passport.serializeUser(User.serializeUser());       //serialize:creates cookie & user identification
passport.deserializeUser(User.deserializeUser());   //crumble cookie & discover cookie deetails inside


app.get('/', (req, res) => {
    res.render("home");       //set app.view as ejs
})

app.get('/register', (req, res) => {
    res.render("register");       //set app.view as ejs
})

app.get('/login', (req, res) => {
    res.render("login");       //set app.view as ejs
})

app.get('/secret', (req, res) => {

    //if user is authenticated then
    if (req.isAuthenticated()) {
        res.render("secret");       //set app.view as ejs
    }
    else {
        res.redirect('/login');
    }
    // IF I AM ALREADY REGISTERED THEN I CAN DIRECTLY RENDER THIS PAGE & DO NOT NEED TO LOGIN AGAIN 
});

//when submitted form- post request
app.post('/register', async (req, res) => {
    //render secret page only when registered/login

    //from passport-local-mongoose documentation  👇🏻
    User.register({ username: req.body.username}, req.body.password, function (err, user) {
        if (err) {
            console.log("Error occurred " + err);
            res.redirect('/register');
        }
        else {
            passport.authenticate("local")(req, res, function () {
                //successfully created cookie & logged in
                res.redirect('/secret');    //not res.render("secret") so create /secret route
            });
        }
    });
});

app.post('/login', async (req, res) => {
    //render secret page only when login with correct email&pass

    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    //using passport method: 👇🏻
    req.login(user, function (err) {
        if (err) {
            console.log("Error occurred " + err);
        }
        else {
            passport.authenticate("local")(req, res, function () {
                //successfully created cookie & logged in
                res.redirect('/secret');    //not res.render("secret") so create /secret route
            });
        }
    })
});

// to logout:

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`)
})
