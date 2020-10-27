const httpcode = require('../lib/httpcode')

module.exports = {
  name: 'example',
  schema: {
    $id: 'http://express-gateway.io/schemas/policies/example.json',
    type: 'object',
    properties: {},
    required: []
  },
  policy: (actionParams) => {
    return (req, res, next) => {
      if (req.headers.example) {
        res.sendStatus(httpcode.OK)
      } else {
        res.sendStatus(httpcode.BadRequest)
      }
    }
  }
}
