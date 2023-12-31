// models/user.js

const mongoose = require("mongoose")

const User = new mongoose.Schema({
    name: { type: String, required: true},    
    username: { type: String, required: true, unique: true},
    email: { type: String, required: true},    
    password: { type: String, required: true},
    profile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile" 
    }           
})


module.exports =  mongoose.model('User', User)