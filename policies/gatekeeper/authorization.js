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

const prepareRequestHeaders = (acl, req) => {
  if (!req.headers['x-route']) {
    req.headers['x-route'] = xroute.encode(Object.keys(acl))
  }
}

const isAuthorized = (acl, req) => {
  const endpoints = xroute.decode(req.headers['x-route'])

  if (endpoints.length) {
    return endpoints.reduce(
      (m, endpoint) => m && !!acl[endpoint] && !!acl[endpoint].exec(req.path),
      true
    )
  } else {
    return false
  }
}

module.exports = {
  compileAcls,
  prepareRequestHeaders,
  isAuthorized
}
