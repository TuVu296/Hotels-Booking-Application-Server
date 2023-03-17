const adminGuardCheck = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(401).send({
      message: 'Unauthorized, must be admin to call this request'
    })
  }

  next()
}

module.exports = adminGuardCheck