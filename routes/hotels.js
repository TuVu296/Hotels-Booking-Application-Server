const express = require('express')
const hotelController = require('../controllers/hotelController')

const router = express.Router()

router.get('/', hotelController.getHotels)
router.get('/:id', hotelController.getHotelById)
router.post('/search', hotelController.searchHotels)
router.post('/:id/checkroom', hotelController.getValidRoomByHotelId)




module.exports = router