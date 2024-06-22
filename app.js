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

// npm i dotenv
import 'dotenv/config'

//OAuth passport 2.0 version
// npm install passport-google-oauth20
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

//npm i mongoose-findorcreate
import findOrCreate from 'mongoose-findorcreate';

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'));

//place this code before mongoose.connect & after all other app.use
//for express-session 👇🏻:
app.use(session({
    //secret is a long string that will be stored in our .env file
    secret: "Thisisalongstring",
    // secret: process.env.SECRET,
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
    email: String,
    password: String,
    //we must have id for google authentication
    googleId: String,
});

//set up passport-local-mongoose as a plugin 👇🏻 to hash & salt passowrd  & save users to mongodb db
userSchema.plugin(passportLocalMongoose)
//set up findOrCreate mongoose as a plugin 👇🏻
userSchema.plugin(findOrCreate);

//create model
const User = mongoose.model("User", userSchema);

//passport-local-mongoose documentation  👇🏻

passport.use(User.createStrategy());                // create Strategy
passport.serializeUser(function (user, done) {
    done(null, user.id)
});       //serialize:creates cookie & user identification


passport.deserializeUser(function (id, done) {
    User.findById(id).then(function (user) {
        done(null, user);
    }).catch(function (err) {
        done(err, null);
    });
});     //crumble cookie & discover cookie deetails inside

//after passport serialize & deserailze- add passport.use for google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,                        //paste from google auth from .env file
    clientSecret: process.env.CLIENT_SECRET,                //paste from google auth from .env file
    callbackURL: "http://localhost:3000/auth/google/secret" //paste redirect url
},
    function (accessToken, refreshToken, profile, cb) {
        //profile will contain email
        console.log("\nGoogle send this profile: ");
        console.log(profile);
        //mongoose findOrCreate package
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get('/', (req, res) => {
    res.render("home");       //set app.view as ejs
})

//to login with google a: /auth/google
app.get('/auth/google',
    //initiate authentication with google 
    passport.authenticate('google', { scope: ['profile'] }));//not "local" strategy but "google"


//to rediect after google authentication
app.get('/auth/google/secret',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect .
        res.redirect('/secret');
    });

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

// to logout:
app.get('/logout', function (req, res) {
    //deauthenticate user & end user session
    req.logOut(function (err) {
        if (err) {
            console.log(err);
        }
        else {
            res.redirect('/');  //home page
        }
    });
})

//when submitted form- post request
app.post('/register', async (req, res) => {
    //render secret page only when registered/login

    //from passport-local-mongoose documentation  👇🏻
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
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


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`)
})
