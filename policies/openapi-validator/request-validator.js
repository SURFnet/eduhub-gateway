const { ValidationError } = require('express-openapi-validate')

const httpcode = require('../../lib/httpcode')

const makeValidateRequestMiddleware = (validator) => (
  ((handler) =>
    (req, res, next) => {
      handler(req, res, (err) => {
        if (err instanceof ValidationError) {
          res.set('content-type', 'application/json')
          res.status(httpcode.BadRequest)
          res.send(JSON.stringify({ message: err.message, data: err.data }))
        } else if (err instanceof Error) {
          res.set('content-type', 'text/plain')
          res.status(httpcode.InternalServerError)
          res.send(err.message)
        } else {
          next(err)
        }
      })
    }
  )(validator.match())
)

module.exports = { makeValidateRequestMiddleware }
