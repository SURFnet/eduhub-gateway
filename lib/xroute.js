const lodash = require('lodash')

class MalformedHeader extends Error {}

const encode = (endpoints) => (
  `endpoint=${endpoints.join(',')}`
)

const decode = (xroute) => {
  if (xroute) {
    const [, endpoints] = /^\s*endpoint\s*=([\w\s,]*)$/.exec(xroute) || []
    if (endpoints) {
      return lodash.uniq(endpoints.trim().split(/\s*,\s*/))
    } else {
      throw new MalformedHeader(xroute)
    }
  }
  return null
}

module.exports = { encode, decode, MalformedHeader }
