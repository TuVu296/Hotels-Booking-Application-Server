const express = require('express')
const cors = require('cors')
const connectToDb = require('../db/database')
const usersRouter = require('../routes/users')
const hotelRouter = require('../routes/hotels')
const transactionRouter = require('../routes/transaction')
const adminRouter = require('../routes/admin')

connectToDb()

const app = express()
app.use(express.static('public'))
app.use(express.json())
app.use(cors())

app.use('/admin', adminRouter)
app.use('/user', usersRouter)
app.use('/hotel', hotelRouter)
app.use('/transactions', transactionRouter)


// app.listen(5000, () => console.log('server is running on port 5000'))

// export to deploy to Vercel
module.exports = app