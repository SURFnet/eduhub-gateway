const pathToRegexp = require('path-to-regexp')
const modifyResponse = require('express-modify-response')

const { oasPathToExpressPath } = require('express-openapi-validate/dist/schema-utils')
const { ValidationError } = require('express-openapi-validate')

const httpcode = require('../../lib/httpcode')

const pathMatchers = (validator) => (
  Object.keys(validator._document.paths).map(path => ({
    path,
    regex: pathToRegexp(oasPathToExpressPath(path))
  }))
)

const matchPath = (matchers, path) => (
  matchers.find(({ regex }) => regex.test(path))
)

const makeValidator = (validator) => {
  const matchers = pathMatchers(validator)

  return (req, res, body) => {
    try {
      // find request path in schema document
      const match = matchPath(matchers, req.path)
      if (match) {
        validator.validateResponse(req.method.toLowerCase(), match.path)(
          {
            statusCode: res.statusCode,
            headers: res.getHeaders(),
            body: JSON.parse(body.toString())
          }
        )
      } else {
        return body
      }
    } catch (e) {
      if (e instanceof ValidationError) {
        res.statusCode = httpcode.BadGateway
        res.setHeader('content-type', 'application/json')
        return JSON.stringify({
          message: e.message,
          data: e.data
        })
      } else {
        res.statusCode = httpcode.InternalServerError
        res.setHeader('content-type', 'text/plain')
        return e.message
      }
    }
    return body
  }
}

const makeValidateResponseMiddleware = (validator) => {
  return modifyResponse(
    (req, res) => {
      // This should return true if the response body is to be validated
      return req.headers['x-validate-response'] === 'true'
    },
    makeValidator(validator)
  )
}

module.exports = { makeValidateResponseMiddleware }
