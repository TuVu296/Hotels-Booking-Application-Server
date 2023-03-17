const dayjs = require('dayjs')
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter')
const customParseFormat = require("dayjs/plugin/customParseFormat")
dayjs.extend( customParseFormat )
dayjs.extend( isSameOrAfter )
const { checkIsRoomsRequestIsInTransaction } = require('../utils')

const Transactions = require('../models/Transaction')
const Hotels = require('../models/Hotel')
const Rooms = require('../models/Room')
const Users = require('../models/Users')

module.exports.createTransaction = async (req, res) => {
  const { hotel, roomNumber, startDate, endDate, price, payment } = req.body

  // Valid du lieu
  if(!hotel) {
    return res.status(400).json(
      {
        message: 'Khong co Hotel'
      }
    )
  }
  if(!roomNumber) {
    return res.status(400).json(
      {
        message: 'Khong co roomNumber'
      }
    )
  }
  if (!startDate) {
    return res.status(400).json(
      {
        message: 'Khong co ngay bat dau'
      }
    )
  }
  if (!dayjs(startDate, 'YYYY-MM-DD', true).isValid()) {
    return res.status(400).json(
      {
        message: 'startDate ko dung format YYYY-MM-DD'
      }
    )
  }
  if (!endDate) {
    return res.status(400).json(
      {
        message: 'Khong co ngay ket thuc'
      }
    )
  }
  if (!dayjs(endDate, 'YYYY-MM-DD', true).isValid()) {
    return res.status(400).json(
      {
        message: 'endDate ko dung format YYYY-MM-DD'
      }
    )
  }
  if (!dayjs(endDate).isSameOrAfter(dayjs(startDate), 'D')) {
    return res.status(400).json(
      {
        message: 'endDate ko duoc truoc startDate'
      }
    )
  }
  if (!dayjs(startDate).isAfter(dayjs(), 'D')) {
    return res.status(400).json(
      {
        message: 'startDate ko duoc truoc hoac la date hien tai'
      }
    )
  }

  const newDateStart = dayjs(startDate, 'YYYY-MM-DD').valueOf()
  const newDateEnd = dayjs(endDate, 'YYYY-MM-DD').valueOf()

  // Check if room is available at current time

  const foundTransactions = await Transactions.find({
    // Cac th bi trung transaction, 
    // Th1: newDateStart < dateStart & newDateEnd >= dateStart
    // Th2: dateStart <= newDateStart & dateEnd >= newDateStart
    $or: [
      {
        hotel,
        dateStart: { $gt: newDateStart, $lte: newDateEnd },
      },
      {
        hotel,
        dateStart: { $lte: newDateStart },
        dateEnd: { $gte: newDateStart }
      }
    ]
  })

  if (foundTransactions.length) {
    // Check room in foundTransaction
    const isRoomInTransaction = !!foundTransactions.find(trans => {
      return checkIsRoomsRequestIsInTransaction(roomNumber, trans.room)
    })

    if (isRoomInTransaction) {
      return res.status(400).json(
        {
          message: 'phong ban chon da duoc dat trong thoi gian nay'
        }
      )
    }
  }

  const newTransaction = new Transactions({
    user: req.user.id,
    hotel,
    room: roomNumber,
    dateStart: newDateStart,
    dateEnd: newDateEnd,
    price: price,
    payment: payment,
    status: 'Booked'
  })

  // Create new transaction
  await newTransaction.save()

  

  res.status(201).json({
    transaction: newTransaction
  })
}

module.exports.getTransactions = async (req, res) => {
  const currentUserId = req.user.id

  const transactions = await Transactions.find({
    user: currentUserId,
  }).sort({
    createdAt: -1
  }).populate('hotel')

  if (transactions.length) {
    return res.json(transactions)
  } else {
    return res.status(200).json([])
  }
}

module.exports.getTransactionsAsAdmin = async (req, res) => {
  const transactions = await Transactions
    .find()
    .populate('hotel')
    .populate('user')

  if (transactions.length) {
    return res.json(transactions)
  } else {
    return res.status(200).json([])
  }
}

module.exports.getTransactionsTop8AsAdmin = async (req, res) => {
  const totalUser = await Users.countDocuments()
  const totalOrder = await Transactions.countDocuments()
  const totalEarnings = await Transactions.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: '$price' }
      }
    }
  ])
  const totalBalance = Number((totalEarnings[0].total / 12).toFixed(2))

  const transactions = await Transactions
    .find()
    .sort({createdAt: -1})
    .limit(8)
    .populate('hotel')
    .populate('user')

    return res.json({
      transactions,
      totalUser,
      totalOrder,
      totalEarnings: totalEarnings[0].total,
      totalBalance
    })
}

module.exports.getHotelsAsAdmin = async (req, res) => {
  const hotels = await Hotels.find()

  if (hotels.length) {
    return res.json(hotels)
  } else {
    return res.status(200).json([])
  }
}

module.exports.createHotelAsAdmin = async (req, res) => {
  const { name, type } = req.body

  if (!name) {
    return res.status(400).json(
      {
        message: 'Khong co Name'
      }
    )
  }

  if (!type) {
    return res.status(400).json(
      {
        message: 'Khong co Type'
      }
    )
  }

  const newHotel = new Hotels(req.body)

  await newHotel.save()

  res.status(201).json({
    hotel: newHotel
  })
}

module.exports.deleteHotelAsAdmin = async (req, res) => {
  const hotelId = req.params.id

  const findHotel = await Hotels.findById(hotelId)

  if (!findHotel) {
    return res.status(404).json(
      {
        message: `Khong tim thay hotel voi id ${hotelId}`
      }
    ) 
  }

  const transactions = await Transactions.find({
    hotel: hotelId
  })

  if (transactions.length) {
    return res.status(400).json(
      {
        message: 'Khong the xoa hotel co transaction'
      }
    ) 
  }

  await findHotel.delete()

  res.json({
    message: `Da xoa hotel voi id ${hotelId}`
  })
}

module.exports.getRoomsAsAdmin = async (req, res) => {
  const rooms = await Rooms.find()

  if (rooms.length) {
    return res.json(rooms)
  } else {
    return res.status(200).json([])
  }
}

module.exports.createRoomAsAdmin = async (req, res) => {
  const { title, price, maxPeople, desc, roomNumbers } = req.body

  if (!title) {
    return res.status(400).json(
      {
        message: 'Khong co Title'
      }
    )
  }

  if (!price) {
    return res.status(400).json(
      {
        message: 'Khong co Price'
      }
    )
  }

  if (!maxPeople) {
    return res.status(400).json(
      {
        message: 'Khong co maxPeople'
      }
    )
  }

  if (!desc) {
    return res.status(400).json(
      {
        message: 'Khong co desc'
      }
    )
  }

  if (!roomNumbers) {
    return res.status(400).json(
      {
        message: 'Khong co roomNumbers'
      }
    )
  }

  const newRoom = new Rooms(req.body)

  await newRoom.save()

  res.status(201).json({
    room: newRoom
  })

}

module.exports.deleteRoomAsAdmin = async (req, res) => {
  const roomId = req.params.id

  const foundRoom = await Rooms.findById(roomId)

  if (!foundRoom) {
    return res.status(404).json(
      {
        message: `Khong tim thay room voi id ${roomId}`
      }
    )
  }

  const hotels = await Hotels.find({ rooms: roomId })

  if (hotels.length) {
    return res.status(400).json(
      {
        message: `Room ${roomId} da duoc su dung`
      }
    )
  }

  await foundRoom.delete()
  res.json({
    message: `Da xoa room voi id ${roomId}`
  })
}