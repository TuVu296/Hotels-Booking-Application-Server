const express = require('express')
const transactionController = require('../controllers/transactionController')
const authMiddleware = require('../middlewares/auth')

const router = express.Router()

router.post('/', authMiddleware, transactionController.createTransaction)
router.get('/', authMiddleware, transactionController.getTransactions)

module.exports = router