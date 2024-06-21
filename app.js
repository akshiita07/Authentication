//npm init -y
//npm i express body-parser ejs
//npm i mongoose
// npm i bcrypt          for hash fnc

//create .env file in root directory of project->hidden file
//this .env file must be in .gitignore

//add environment variables in form of name=value

import express from 'express';
import bodyParser from 'body-parser';
import ejs from 'ejs';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
const saltRounds = 10;      //for salting

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render("home");       //set app.view as ejs
})

app.get('/register', (req, res) => {
    res.render("register");       //set app.view as ejs
})

app.get('/login', (req, res) => {
    res.render("login");       //set app.view as ejs
})

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
});

//create model
const user = mongoose.model("user", userSchema);

//when submitted form- post request
app.post('/register', async (req, res) => {
    //render secret page only when registered/login

    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        //create new user
        const newUser = new user({
            email: req.body.email,
            //store hashed password in db
            password: hash,     //from bcrypt
        })

        //save & render
        newUser.save()
                .then(function () {
                    res.render("secret");
                })
                .catch(function (err) {
                    console.log("Error occurred " + err);
                });
    });
});

app.post('/login', async (req, res) => {
    //render secret page only when login with correct email&pass
    const emailInput = req.body.email;
    const passInput = req.body.password;

    try {
        const userFound = await user.findOne({ email: emailInput });
        if (userFound) {
            bcrypt.compare(passInput, userFound.password, function (err, result) {
                if(result===true){
                    res.render("secret");
                }
            });
        }
        else {
            console.log("You r not registered!");
            res.redirect('/register');
        }
    }
    catch (err) {
        console.log("Error occurred " + err);
    }

});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`)
})
