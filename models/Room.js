const mongoose = require('mongoose')

const roomSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
    },
    price: {
        type: Number,
        required: true
    },
    maxPeople: {
        type: Number
    },
    desc: {
        type: String
    },
    roomNumbers: {
        type: [Number]
    }
})

const Rooms = mongoose.model('rooms', roomSchema)
module.exports = Rooms