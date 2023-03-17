module.exports.checkIsRoomsRequestIsInTransaction = (roomNumber, transactionRoomNumber) => {
  const hashMap = {}

  for (const room of roomNumber) {
    hashMap[room] = true
  }

  for (const room of transactionRoomNumber) {
    if (room in hashMap) {
      return true
    }
  }
  return false
}

// originalArr: [112, 113, 114], transactionArr: [113, 114, 115]

// output: [112]

module.exports.mergeAndFilterDuplicateInTwoArray = (originalArr, transactionArr) => {
  const hashMap = {}
  const output = []
  for (const item of transactionArr) {
    hashMap[item] = true
  }

  for (const item of originalArr) {
    if (!(item in hashMap)) {
      output.push(item)
    }
  }

  return output
}