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

// npm install passport-facebook
import FacebookStrategy from 'passport-facebook';

//npm i passport-github2
import { Strategy as GitHubStrategy } from 'passport-github2';

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'));

//place this code before mongoose.connect & after all other app.use
//for express-session 👇🏻:
app.use(session({
    //secret is a long string that will be stored in our .env file
    secret: process.env.SECRET,
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
    email: String,
    password: String,
    //we must have id for google authentication
    googleId: String,
    // save secret when user submits a secret
    secret: [String],
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
//go to google developers
passport.use(new GoogleStrategy({
    clientID: process.env.GOOG_CLIENT_ID,                        //paste from google auth from .env file
    clientSecret: process.env.GOOG_CLIENT_SECRET,                //paste from google auth from .env file
    callbackURL: "http://localhost:3000/auth/google/secret" //paste redirect url
},
    function (accessToken, refreshToken, profile, cb) {
        //profile will contain email
        console.log("\nGoogle send this profile: ");
        console.log(profile);
        //mongoose findOrCreate package
        User.findOrCreate({
            googleId: profile.id,
            username: profile.emails[0].value
        }, function (err, user) {
            return cb(err, user);
        });
    }
));

passport.use(new FacebookStrategy({
    //go to facebook developers
    clientID: process.env.FB_CLIENT_ID,
    clientSecret: process.env.FB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secret"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ facebookId: profile.id }, function (err, user) {
            console.log("Facebook authentication response:", profile);
            return cb(err, user);
        });
    }
));

// new application can be created at developer applications within GitHub's settings pane
passport.use(new GitHubStrategy({
    clientID: process.env.GIT_CLIENT_ID,
    clientSecret: process.env.GIT_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/github/secret"
},
    function (accessToken, refreshToken, profile, done) {
        User.findOrCreate({ 
            githubId: profile.id,
            username: profile.emails[0].value,
        }, function (err, user) {
            return done(err, user);
        });
    }
));

app.get('/', (req, res) => {
    res.render("home");       //set app.view as ejs
})

//to login with google a: /auth/google
app.get('/auth/google',
    //initiate authentication with google 
    passport.authenticate('google', { scope: ['profile', 'email'] }));//not "local" strategy but "google"


//to rediect after google authentication
app.get('/auth/google/secret',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect .
        res.redirect('/secret');
    });

//to login with facebook a: /auth/facebook
app.get('/auth/facebook',
    //initiate authentication with facebook 
    passport.authenticate('facebook', { scope: ['profile'] }));//not "local" strategy but "facebook"


//to rediect after facebook authentication
app.get('/auth/facebook/secret',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect .
        res.redirect('/secret');
    });

app.get('/auth/github',
    passport.authenticate('github', { scope: ['profile', 'email'] }));

app.get('/auth/github/secret',
    passport.authenticate('github', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secret');
    });

app.get('/register', (req, res) => {
    res.render("register");       //set app.view as ejs
})

app.get('/login', (req, res) => {
    res.render("login");       //set app.view as ejs
})

let userFound = [];
app.get('/secret', (req, res) => {

    User.find({
        "secret": { $ne: [] }    //look thru all users in db then pick users for which secret is not null
    })
        .then(function (userFound) {
            if (userFound) {
                // if a user is found then
                res.render("secret", {
                    usersWithSecrets: userFound,
                })
            }
        })
        .catch(function (err) {
            console.error('Error occurred to find such user:', err);
        });
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

// for submitting route
app.get("/submit", function (req, res) {
    // if authenticated user then render submit page
    if (req.isAuthenticated()) {
        res.render("submit");
    }
    else {
        res.redirect('/login');
    }

});

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

//for submitting a secret:
app.post("/submitSecret", function (req, res) {
    console.log(`User entered a new secret: ${req.body.userSecret}`);
    const submittedSecret = req.body.userSecret;
    console.log(`User: ${req.user}`);
    console.log(`User id: ${req.user.id}`);

    User.findById(req.user.id)
        .then(function (userFound) {
            if (userFound) {
                // if a user is found then add it to array
                userFound.secret.push(submittedSecret);
                userFound.save()
                    .then(function () {
                        res.redirect("/secret")
                    })
                    .catch(function (err) {
                        console.error('Error occurred: ', err);
                    });
            }
        })
        .catch(function (err) {
            console.error('Error occurred to find such use:', err);
        });

    //get current user & save his secret 
})


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`)
})
