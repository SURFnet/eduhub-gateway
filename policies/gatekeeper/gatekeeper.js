const logger = require('express-gateway/lib/logger').createLoggerWithLabel('[OAGW:Gatekeeper]')

const httpcode = require('../../lib/httpcode')
const authentication = require('./authentication')
const authorization = require('./authorization')
const credentials = require('./credentials')

const realm =
      process.env.SURFNET_OOAPI_GW_CLIENT_REALM ||
      'SURFnet OOAPI Gateway client access'

function assertAllEndpointsDefined ({ acls }, { gatewayConfig: { serviceEndpoints } }) {
  const available = Object.keys(serviceEndpoints)
  const required = Object.keys(
    acls.reduce((m, { endpoints }) =>
      endpoints.reduce((m, { endpoint }) => {
        m[endpoint] = true
        return m
      }, m), {})
  )

  required.forEach(endpoint => {
    if (!available.includes(endpoint)) {
      throw new Error(`required service endpoint '${endpoint}' not configured`)
    }
  })
}

module.exports = (params, config) => {
  logger.info('initializing gatekeeper policy')

  assertAllEndpointsDefined(params, config)
  const acls = authorization.compileAcls(params.acls)
  logger.debug(`known apps: ${Object.keys(acls)}`)

  return (req, res, next) => {
    const app = authentication.appFromRequest(req, credentials.read(params.credentials))
    delete req.headers.authorization

    if (app) {
      const acl = acls[app]

      if (acl) {
        authorization.prepareRequestHeaders(acl, req)
        if (authorization.isAuthorized(acl, req)) {
          next()
          return
        }
      }

      res.sendStatus(httpcode.Forbidden)
    } else {
      res.set({ 'WWW-Authenticate': `Basic realm="${realm}"` })
      res.sendStatus(httpcode.Unauthorized)
    }
  }
}
