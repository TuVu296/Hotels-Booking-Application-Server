const Users = require('../models/Users')
const { createToken } = require('../jwt/token')

module.exports.signup = async (req, res) => {
  const { username, password } = req.body

  //B1: valid thong tin
  if (!username || !password) {
    return res.status(400).json(
      {
        message: 'Chua nhap username hoac password'
      }
    )
  }
  // B2: Xu ly logic
  // B2.1: Check user co ton tai trong db hay chua
  const foundUser = await Users.findOne({ username }).exec()

  if (foundUser) {
    return res.status(400).json(
      {
        message: 'User da ton tai'
      }
    )
  }
  // B2.2: Tao user 

  const newUser = new Users({username, password})
  await newUser.save()
  // B3: Tra res
  res.json(
    {
      user: newUser,
      message: 'Dang ky thanh cong'
    }
  )
}


module.exports.login = async (req, res) => {
  const {username, password} = req.body
  // B1: valid du lieu
  if (!username || !password) {
    return res.status(400).json(
      {
        message: 'Chua nhap username hoac password'
      }
    )
  }
  // B2: Xu ly logic
  // B2.1: user da ton tai chua
  const foundUser = await Users.findOne({ username }).exec()

  if (!foundUser) {
    return res.status(400).json(
      {
        message: 'User chua duoc dang ky'
      }
    )
  }
  // B2.2: Dung passwork khong
  if (foundUser.password !== password) {
    return res.status(400).json(
      { 
        message: 'Sai mat khau'
      }
    )
  }
  // B3: Tra token
  const token = createToken({username: foundUser.username, id: foundUser._id, isAdmin: foundUser.isAdmin})

  res.json(
    {
      user: foundUser,
      token
    }
  )
}
