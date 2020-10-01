const authentication = require('./authentication');

const realm =
      process.env.SURFNET_OOAPI_GW_CLIENT_REALM ||
      'SURFnet OOAPI Gateway client access';

module.exports = (params) => (
  (req, res, next) => {
    if (authentication.appFromRequest(req, params.apps)) {
      delete req.headers.authorization;
      next();
    } else {
      res.set({'WWW-Authenticate': `Basic realm="${realm}"`});
      res.status(401).send('Unauthorized');
    }
  }
)
