const User = require('./models/user')
const Profile = require('./models/profile')
const Article = require('./models/article')
const mongoose = require('mongoose')
const express = require("express")
const session = require('express-session')
const methodOverride = require('method-override')
const bcrypt = require('bcryptjs')
const articleRouter = require('./routes/articles')
const app = express()
const loginRequired = require('./middlewares/login-required')
const checkGuest = require('./middlewares/check-guest')
const multer = require('multer')
const path = require('path')

let uri = 'put-your-connection-string-here'

mongoose.connect(uri)
.then(() => {
    console.log("Mongoose connected")
})
.catch(() => {
    console.log("Database connection error")
})

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({
    storage: storage
})

app.set('view engine', 'ejs')

app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(express.static('public'))
app.use(methodOverride('_method'))

app.use(session({
  name: "mosalles.sid",
  secret: 'some secret',
  resave: false,
  saveUninitialized: false,    
  cookie: {
      maxAge: 1000 * 60 * 60 * 24
  }
}))

// Show user's profile in a form, so they can edit it
app.get('/profile/edit', loginRequired, async (req, res) => {    
    const userProfile = await Profile.findOne({owner: req.session.userID})        

    res.render('profile/edit', {profile: userProfile})
})

app.get('/profile/show', loginRequired, async (req, res) => {
    const userProfile = await Profile.findOne({owner: req.session.userID})
    const userArticles = await Article.find({user: req.session.userID})
    
    res.render('profile/show', {profile: userProfile, articles: userArticles})
})

app.post("/upload", loginRequired, upload.single("uploaded_file"), async (req, res) => {    

    const oldProfile = await Profile.findOne({owner: req.session.userID})


    try {
        const updProfile = await Profile.findOneAndUpdate(
            {owner: req.session.userID},
            {
                bio: req.body.bio,
                location: req.body.location,
                image: req.file ? req.file.filename : oldProfile.image,
                isImageExternal: false
            },
            {
                new: true
            }
        )              
      
        return res.redirect('/profile/show')
    } catch(e) {        
        return res.redirect('/profile/edit')
    }
    
})


app.get("/register", checkGuest, (req, res) => {
    res.render('auth/register')
})

app.get('/login', checkGuest, (req, res) => {
    
    res.render('auth/login')
})

app.post("/register", async (req, res) => {    
  const {name, username, email, password} = req.body
  
  // Password length should be more than 5 characters
  if(password.length < 5) {
      res.render('auth/register', {message: 'Password must be more than 5 characters'})
  }    
  
  // If more than 5, we hash the password
  const hashedPassword = await bcrypt.hash(password, 10)    

  // Then we create a new user in the database 
  try {        
  
      const user = await User.create({
          username,
          name,
          email,
          password: hashedPassword
      })            

      const newProfile = new Profile({
          bio: '',
          location: '',
          image: '',            
          owner: user
      })

      const savedProfile = await newProfile.save()

      // Add profile to the user
      user.profile = savedProfile
      const updateUser = await user.save()            
      
      // Create session for the user
      req.session.userID = user.id    

      res.redirect("/home")

  } catch(e) {        
    console.log(e)
    res.redirect("/register")
  }
})

app.get("/home", loginRequired, async (req, res) => {            
    const articles = await Article.find().sort({createdAt: 'desc'}).populate('user')           
    const profile = await Profile.findOne({owner: req.session.userID})
    
    res.render('articles/index', {articles: articles, userID: req.session.userID, profile: profile})
})

app.get('/logout', loginRequired, (req, res) => {
    delete req.session.userID
    
    res.redirect("/login")
})

app.post("/login", checkGuest, async (req, res) => {    
    const {username, password} = req.body
    
    const user = await User.findOne({username: username})

    if(!user) {
        res.render("auth/login", {message: 'User does not exist'})            
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password)

    if(!isPasswordCorrect) {
        res.render("auth/login", {message: 'Incorrect login details'})            
    }

    req.session.userID = user.id

    res.redirect("/home")    
})

app.use('/articles', articleRouter)

app.listen(5000, ()=> {
  console.log("Application is live")
})