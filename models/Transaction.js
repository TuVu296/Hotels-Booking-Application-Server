const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    hotel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'hotels',
        required: true
    },
    room: {
        type: [Number],
        required: true
    },
    dateStart: {
        type: Date,
        required: true
    },
    dateEnd: {
        type: Date,
        required: true
    },
    price: {
        type: Number
    },
    payment: {
        type: String
    },
    status: {
        type: String
    },
}, { timestamps: true })

const Transactions = mongoose.model('transactions', transactionSchema)
module.exports = Transactions