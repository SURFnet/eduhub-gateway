const pathToRegexp = require('path-to-regexp')
const xroute = require('../../lib/xroute')

const compileAcls = (acls) => (
  acls.reduce((m, { app, endpoints }) => {
    m[app] = endpoints.reduce((m, { endpoint, paths }) => {
      m[endpoint] = new RegExp(
        paths.map(path => pathToRegexp(path).source).join('|')
      )
      return m
    }, {})
    return m
  }, {})
)

const isAuthorized = (app, acls, req) => {
  const acl = acls[app]
  if (!acl) return false

  try {
    const endpoints = xroute.decode(req.headers['x-route']) || Object.keys(acl)

    if (endpoints.length) {
      return endpoints.reduce(
        (m, endpoint) => m && !!acl[endpoint] && !!acl[endpoint].exec(req.path),
        true
      )
    } else {
      return false
    }
  } catch (e) {
    if (e instanceof xroute.MalformedHeader) {
      return false
    } else {
      throw e
    }
  }
}

module.exports = {
  compileAcls,
  isAuthorized
}
