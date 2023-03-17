const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
    fullName: {
        type: String
    },
    phoneNumber: {
        type: String
    },
    email: {
        type: String
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
})

const Users = mongoose.model('users', userSchema)
module.exports = Users