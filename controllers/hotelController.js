const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter')
dayjs.extend(customParseFormat).extend(isSameOrAfter)
const { mergeAndFilterDuplicateInTwoArray } = require('../utils')

const Hotel = require('../models/Hotel')
const Transactions = require('../models/Transaction')

module.exports.getHotels = async (req, res) => {
  const hostUrl = `${req.protocol}://${req.get('host')}`
  // Số lượng các khách sạn theo khu vực: Hà Nội, HCM và Đà Nẵng.
  const areas = [
    {
      image: `${hostUrl}/img/ha_noi.jpg`,
      name: 'Ha Noi',
      total: await Hotel.find({ city: 'Ha Noi' }).count()
    },
    {
      image: `${hostUrl}/img/hcm.jpg`,
      name: 'Ho Chi Minh',
      total: await Hotel.find({ city: 'Ho Chi Minh' }).count()
    },
    {
      image: `${hostUrl}/img/da_nang.jpg`,
      name: 'Da Nang',
      total: await Hotel.find({ city: 'Da Nang' }).count()
    },
  ]

  // Số lượng khách sạn theo từng loại.
  const types = [
    {
      image: 'https://cf.bstatic.com/xdata/images/xphoto/square300/57584488.webp?k=bf724e4e9b9b75480bbe7fc675460a089ba6414fe4693b83ea3fdd8e938832a6&o=',
      name: 'Hotel',
      total: await Hotel.find({ type: 'hotel' }).count()
    },
    {
      image: 'https://cf.bstatic.com/static/img/theme-index/carousel_320x240/card-image-apartments_300/9f60235dc09a3ac3f0a93adbc901c61ecd1ce72e.jpg',
      name: 'Apartments',
      total: await Hotel.find({ type: 'apartments' }).count()
    },
    {
      image: 'https://cf.bstatic.com/static/img/theme-index/carousel_320x240/bg_resorts/6f87c6143fbd51a0bb5d15ca3b9cf84211ab0884.jpg',
      name: 'Resorts',
      total: await Hotel.find({ type: 'resorts' }).count()
    },
    {
      image: 'https://cf.bstatic.com/static/img/theme-index/carousel_320x240/card-image-villas_300/dd0d7f8202676306a661aa4f0cf1ffab31286211.jpg',
      name: 'Villas',
      total: await Hotel.find({ type: 'villas' }).count()
    },
    {
      image: 'https://cf.bstatic.com/static/img/theme-index/carousel_320x240/card-image-chalet_300/8ee014fcc493cb3334e25893a1dee8c6d36ed0ba.jpg',
      name: 'Cabins',
      total: await Hotel.find({ type: 'cabins' }).count()
    }
  ]

  // Top 3 khách sạn có rating cao nhất.
  const top3 = await Hotel.find().sort({rating: -1}).limit(3)
  
  res.json(
    {
      areas,
      types,
      top3,
    }
  )
}

module.exports.searchHotels = async (req, res) => {
  const { location, fromDate, toDate, totalPeople, rooms } = req.body

  // B1: Validate du lieu
  if (!location) {
    return res.status(400).json(
      {
        message: 'Khong co khu vuc'
      }
    )
  }
  if (!fromDate) {
    return res.status(400).json(
      {
        message: 'Khong co ngay bat dau'
      }
    )
  }
  if (!dayjs(fromDate, 'YYYY-MM-DD', true).isValid()) {
    return res.status(400).json(
      {
        message: 'fromDate ko dung format YYYY-MM-DD'
      }
    )
  }
  if (!toDate) {
    return res.status(400).json(
      {
        message: 'Khong co ngay ket thuc'
      }
    )
  }
  if (!dayjs(toDate, 'YYYY-MM-DD', true).isValid()) {
    return res.status(400).json(
      {
        message: 'toDate ko dung format YYYY-MM-DD'
      }
    )
  }
  if (!dayjs(toDate).isSameOrAfter(dayjs(fromDate), 'D')) {
    return res.status(400).json(
      {
        message: 'toDate ko duoc truoc fromDate'
      }
    )
  }
  if (!dayjs(fromDate).isAfter(dayjs(), 'D')) {
    return res.status(400).json(
      {
        message: 'fromDate ko duoc truoc hoac la date hien tai'
      }
    )
  }
  if (!totalPeople) {
    return res.status(400).json(
      {
        message: 'Khong co so nguoi'
      }
    )
  }
  if (!rooms) {
    return res.status(400).json(
      {
        message: 'Khong co so phong'
      }
    )
  }

  // B2: Tao query object
  const query = {
    city: {
      $regex: new RegExp(location, 'i')
    }

  }

  // Kiem hotel theo location
  const hotels = await Hotel.find(query).populate('rooms')

  // Loc valid hotel voi dieu kien so rooms va tong so nguoi theo room lon hon req.body.rooms va req.body.totalPeople
  let validHotels = hotels.filter(hotel => !!hotel.rooms.find(room => {
    const maxTotalRoom = (room.roomNumbers || []).length
    const maxTotalPeople = maxTotalRoom * room.maxPeople
    return maxTotalRoom >= rooms && maxTotalPeople >= totalPeople
  }))

  // Chuyen fromDate va newDate sang timestamp de bo vao dieu kien query
  const newDateStart = dayjs(fromDate, 'YYYY-MM-DD').valueOf()
  const newDateEnd = dayjs(toDate, 'YYYY-MM-DD').valueOf()

  // Tao list Id cua validHotels
  const validHotelsIdList = validHotels.map(hotel => hotel._id)

  // Kiem Transaction theo list valid hotels co fromDate + toDate trung
  const foundTransactions = await Transactions.find({
    $or: [
      {
        hotel: {
          $in: validHotelsIdList
        },
        dateStart: { $gt: newDateStart, $lte: newDateEnd },
      },
      {
        hotel: {
          $in: validHotelsIdList
        },
        dateStart: { $lte: newDateStart },
        dateEnd: { $gte: newDateStart }
      }
    ]
  })

  // Neu ko co transaction thi tra ve validHotels
  // Nhung neu co transaction thi phai xu ly logic de loai bo nhung phong da dat trong transaction
  // Roi check lai xem hotel co thoa dieu kien ve maxRooms va maxPeople ko
  if (foundTransactions.length) {

    // Tao hashMap de chua thong tin key: la HotelId, value: la mot array chua room co trong tat ca cac transaction
    const hashMap = {}
  
    for (const transaction of foundTransactions) {
      hashMap[transaction.hotel] = hashMap[transaction.hotel] ? [...hashMap[transaction.hotel], ...transaction.room] : [...transaction.room]
    }

    // Loc nhung hotel ko thoa dieu kien ve maxPeople hoac maxRooms
    validHotels = validHotels.filter(hotel => {

      // loc roomType voi dieu kien la con roomsNumber
      hotel.rooms = hotel.rooms.filter(roomType => {
        const transactionRoomNumber = hashMap[hotel._id] || []
        // mergeAndFilterDuplicateInTwoArray la 1 ham de loai bo nhung roomNumbers da duoc dat trong transaction
        roomType.roomNumbers = mergeAndFilterDuplicateInTwoArray(roomType.roomNumbers, transactionRoomNumber)
        return roomType.roomNumbers.length !== 0
      })

      return !!hotel.rooms.find(room => {
        const maxTotalRoom = (room.roomNumbers || []).length
        const maxTotalPeople = maxTotalRoom * room.maxPeople
        return maxTotalRoom >= rooms && maxTotalPeople >= totalPeople
      })
    })
  }

  
  // B3: Tra ve response
  res.json(validHotels)
}

module.exports.getHotelById = async (req, res) => {
  const id = req.params.id

  try {
    const foundHotelById = await Hotel.findById(id).exec();
    if(!foundHotelById) {
      res.status(400).json(
        {
          message: 'Khong co Id'
        }
      )
    }
    res.json(
      {
        hotel: foundHotelById
      }
    )
  }
   catch (e) {
    e.message
   }

}

module.exports.getValidRoomByHotelId = async (req, res) => {
  const id = req.params.id
  const { fromDate, toDate } = req.body

  if (!fromDate) {
    return res.status(400).json(
      {
        message: 'Khong co ngay bat dau'
      }
    )
  }
  if (!dayjs(fromDate, 'YYYY-MM-DD', true).isValid()) {
    return res.status(400).json(
      {
        message: 'fromDate ko dung format YYYY-MM-DD'
      }
    )
  }
  if (!toDate) {
    return res.status(400).json(
      {
        message: 'Khong co ngay ket thuc'
      }
    )
  }
  if (!dayjs(toDate, 'YYYY-MM-DD', true).isValid()) {
    return res.status(400).json(
      {
        message: 'toDate ko dung format YYYY-MM-DD'
      }
    )
  }
  if (!dayjs(toDate).isSameOrAfter(dayjs(fromDate), 'D')) {
    return res.status(400).json(
      {
        message: 'toDate ko duoc truoc fromDate'
      }
    )
  }
  if (!dayjs(fromDate).isAfter(dayjs(), 'D')) {
    return res.status(400).json(
      {
        message: 'fromDate ko duoc truoc hoac la date hien tai'
      }
    )
  }

  try {
    const foundHotelById = await Hotel.findById(id).populate('rooms');
    if(!foundHotelById) {
      res.status(400).json(
        {
          message: 'Khong co Id'
        }
      )
    }

    const newDateStart = dayjs(fromDate, 'YYYY-MM-DD').valueOf()
    const newDateEnd = dayjs(toDate, 'YYYY-MM-DD').valueOf()

    const foundTransactions = await Transactions.find({
      $or: [
        {
          hotel: id,
          dateStart: { $gt: newDateStart, $lte: newDateEnd },
        },
        {
          hotel: id,
          dateStart: { $lte: newDateStart },
          dateEnd: { $gte: newDateStart }
        }
      ]
    })

    let validRooms = foundHotelById.rooms

    if (foundTransactions) {
      // Get all room number in found transaction
      const allRoomList = foundTransactions.reduce((list, transaction) => list.concat(transaction.room), [])

      validRooms = validRooms.filter(roomType => {
        roomType.roomNumbers = roomType.roomNumbers.filter(roomNumber => !allRoomList.includes(roomNumber))
        return !!roomType.roomNumbers.length
      })
    }


    res.json(
      {
        rooms: validRooms
      }
    )
  }
   catch (e) {
    console.log(e.message)
   }

}