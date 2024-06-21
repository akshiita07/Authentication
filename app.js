//npm init -y
//npm i express body-parser ejs
//npm i mongoose
// npm i md5        to hash fnc

//create .env file in root directory of project->hidden file
//this .env file must be in .gitignore

//add environment variables in form of name=value

import express from 'express';
import bodyParser from 'body-parser';
import ejs from 'ejs';
import mongoose from 'mongoose';
import md5 from 'md5';

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

    //create new user
    const newUser = new user({
        email: req.body.email,
        //store hashed password in db
        password: md5(req.body.password),
    })

    //save & render
    try {
        await newUser.save()
            .then(function () {
                res.render("secret");
            })
            .catch(function (err) {
                console.log("Error occurred " + err);
            });
    } catch (err) {
        console.log("Error occurred: " + err);
    }

});

app.post('/login', async (req, res)=>{
    //render secret page only when login with correct email&pass
    const emailInput = req.body.email;
    //convert user entered password into hashed password
    const passInput = md5(req.body.password);

    try{
        const userFound=await user.findOne({ email: emailInput });
        if (userFound) {
            if (userFound.password === passInput) {
                res.render("secret");
            }
            else {
                console.log("incorrect password entered!");
                res.redirect('/login');
            }
        }
        else {
            console.log("You r not registered!");
            res.redirect('/register');
        }
    }
    catch(err){
        console.log("Error occurred " + err);
    }

});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`)
})
