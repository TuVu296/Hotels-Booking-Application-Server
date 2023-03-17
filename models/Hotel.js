const mongoose = require('mongoose')

const hotelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    type: {
        type: String,
        required: true
    },
    city: {
        type: String
    },
    address: {
        type: String
    },
    distance: {
        type: Number
    },
    photos: {
        type: [String]
    },
    desc: {
        type: String
    },
    rating: {
        type: Number,
        default: 0.0
    },
    featured: {
        type: Boolean
    },
    title: {
        type: String
    },
    cheapestPrice: {
        type: Number
    },
    rooms: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'rooms'
    }]
})




const Hotels = mongoose.model('hotels', hotelSchema)
module.exports = Hotels