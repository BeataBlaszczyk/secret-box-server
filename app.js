//jshint esversion:6

require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
const session = require("express-session");
//let RedisStore = require("connect-redis")(session)
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose")
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require("mongoose-findorcreate");


app.use(express.static("public"));
//app.set('view engine', 'ejs');

app.use(express.json());
app.use(cors());




app.use(session({
  //store: new RedisStore({ client: redisClient }),
  secret: "our little secret.",
  resave: false,
  saveUninitialized: false
}));



app.use(passport.initialize());
app.use(passport.session())

app.use(bodyParser.urlencoded({
  extended: true
}));

//mongodb+srv://admin-beata:<password>@cluster0.yu0at.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
//"mongodb+srv://admin-beata:mleczyk123@cluster0.yu0at.mongodb.net/todolistDB"
mongoose.connect("mongodb+srv://admin-beata:mleczyk123@cluster0.yu0at.mongodb.net/userDB", {
  useNewUrlParser: true
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String
});



const secretSchema = new mongoose.Schema({
  content: String,
  rating: Number

})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//const secret = "Thisisourlittlesecret."
//userSchema.plugin(encrypt, {secret:process.env.SECRET, encryptedFields: ['password']});

const User = new mongoose.model("User", userSchema);
const Secret = new mongoose.model("Secret", secretSchema);

passport.use(User.createStrategy());
//passport.serializeUser(User.serializeUser());
//passport.deserializeUser(User.deserializeUser())
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://desolate-forest-24784.herokuapp.com/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    enableProof: true
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "https://desolate-forest-24784.herokuapp.com/auth/facebook/secrets",
    enableProof: true
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/auth/facebook',

  passport.authenticate('facebook', { scope: 'public_profile'})

);

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: 'http://localhost:3000/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.json({auth: true})
    //res.redirect('/secrets');
  });


// app.get("/submit",function(req, res){
//   if (req.isAuthenticated()){
//   res.render("submit")
//   }else{
//     res.redirect("/login")
//   }


 //})

 app.post("/submit",function(req, res){
   console.log(req.body.secret);

   const secret = new Secret({
     content: req.body.secret,
     rating: 0
   })

 secret.save();
 Secret.update();

 res.json(secret)
   //res.redirect("secrets")


  })

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.json({auth: true})//res.redirect('/secrets');
  });

// app.get("/", function(req, res) {
//   res.render("home");
// });

// app.get("/login", function(req, res) {
//   res.render("login");
// });

// app.get("/register", function(req, res) {
//   res.render("register");
// });


app.post("/register", function(req, res) {

User.register({username:req.body.username}, req.body.password, function(err, user){
  if(err){
    console.log(err);
    res.json({auth: false, error: err})
   
  }else{
    passport.authenticate("local")(req,res, function(){
      res.json({auth: true})
      //res.redirect("http://localhost:3000/secrets")
    })
  }
})

  });



app.get("/secrets", function(req,res){


Secret.find(function(err, foundSecrets){
  if (foundSecrets){
    console.log(foundSecrets)
    res.json(foundSecrets)
   
     //res.render("secrets", {secrets:foundSecrets});
  }
})
  



  // }else{
  //   res.redirect("/login")
  // }
})



app.post("/login", function(req, res) {
  const email = req.body.username;
  const password = req.body.password;


const user = new User({
  username: email,
  password: password
})

let obj={auth: false}

  passport.authenticate("local")(req,res, function(){
   
    obj={auth: true}
    res.json(obj)
   
  })



   
})

app.get("/logout", function(req,res){
  req.logout();
  res.json({auth: false})
  //res.redirect('/');
})

let port = process.env.PORT || 3001
app.listen(port, function() {
  console.log("Successfully started on port 3001. ")
})
