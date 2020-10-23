const pathToRegexp = require('path-to-regexp')

class MalformedXRouteHeader extends Error {}

const extractEndpoints = (req) => {
  const xroute = req.headers && req.headers['x-route']
  if (xroute) {
    const [, endpoints] = /^\s*endpoint\s*=([\w\s,]*)$/.exec(xroute) || []
    if (endpoints) {
      return endpoints.trim().split(/\s*,\s*/)
    } else if (endpoints === '') {
      return []
    } else {
      throw new MalformedXRouteHeader(xroute)
    }
  }
  return null
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
  const acl = acls[app]
  if (!acl) return false

  try {
    const endpoints = extractEndpoints(req) || Object.keys(acl)

    if (endpoints.length) {
      return endpoints.reduce(
        (m, endpoint) => m && !!acl[endpoint] && !!acl[endpoint].exec(req.path),
        true
      )
    } else {
      return false
    }
  } catch (e) {
    if (e instanceof MalformedXRouteHeader) {
      return false
    } else {
      throw e
    }
  }
}

module.exports = {
  compileAcls,
  extractEndpoints,
  isAuthorized,
  MalformedXRouteHeader
}
