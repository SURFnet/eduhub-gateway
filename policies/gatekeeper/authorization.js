const pathToRegexp = require('path-to-regexp')

const extractEndpoints = (req) => {
  const xroute = req.headers && req.headers['x-route']
  if (xroute) {
    const [, endpoints] = /^\s*endpoint\s*=([\w\s,]*)$/.exec(xroute) || []
    if (endpoints) {
      return endpoints.trim().split(/\s*,\s*/)
    }
  }
  return []
}

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
  const acl = acls[app] || {}
  const endpoints = extractEndpoints(req)

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
  extractEndpoints,
  isAuthorized
}
