const authentication = require('./authentication')
const authorization = require('./authorization')
const credentials = require('./credentials')

const realm =
      process.env.SURFNET_OOAPI_GW_CLIENT_REALM ||
      'SURFnet OOAPI Gateway client access'

module.exports = (params) => {
  const acls = authorization.compileAcls(params.acls)

  return (req, res, next) => {
    const app = authentication.appFromRequest(req, credentials.read(params.credentials))
    delete req.headers.authorization

    if (app) {
      if (authorization.isAuthorized(app, acls, req)) {
        next()
      } else {
        res.sendStatus(403)
      }
    } else {
      res.set({ 'WWW-Authenticate': `Basic realm="${realm}"` })
      res.sendStatus(401)
    }
  }
}
