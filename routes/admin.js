const express = require('express')
const transactionController = require('../controllers/transactionController')
const authMiddleware = require('../middlewares/auth')
const adminMiddleware = require('../middlewares/admin')

const router = express.Router()

router.get('/transactions', authMiddleware, adminMiddleware, transactionController.getTransactionsAsAdmin)
router.get('/dashboard', authMiddleware, adminMiddleware, transactionController.getTransactionsTop8AsAdmin)
router.get('/hotels', authMiddleware, adminMiddleware, transactionController.getHotelsAsAdmin)
router.post('/hotels', authMiddleware, adminMiddleware, transactionController.createHotelAsAdmin)
router.delete('/hotels/:id', authMiddleware, adminMiddleware, transactionController.deleteHotelAsAdmin)
router.get('/rooms', authMiddleware, adminMiddleware, transactionController.getRoomsAsAdmin)
router.post('/rooms', authMiddleware, adminMiddleware, transactionController.createRoomAsAdmin)
router.delete('/rooms/:id', authMiddleware, adminMiddleware, transactionController.deleteRoomAsAdmin)

module.exports = router