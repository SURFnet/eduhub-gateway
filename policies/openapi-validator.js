const logger = require('express-gateway/lib/logger').createLoggerWithLabel('[OAGW:Validator]')
const { OpenApiValidator, ValidationError } = require('express-openapi-validate')
const bodyParser = require('body-parser')
const fs = require('fs')
const jsYaml = require('js-yaml')
const { squashMiddlewareStack } = require('../lib/utils.js')
const modifyResponse = require('express-modify-response')
const { oasPathToExpressPath } = require('express-openapi-validate/dist/schema-utils')
const pathToRegexp = require('path-to-regexp')

module.exports = {
  name: 'openapi-validator',
  schema: {
    $id: 'http://express-gateway.io/schemas/policies/openapi-validator.json',
    type: 'object',
    properties: {
      apiSpec: {
        type: 'string',
        description: 'path to the OpenAPI specification to use'
      },
      validateRequests: {
        type: 'boolean',
        description: 'whether to validate requests'
      },
      validateResponses: {
        type: 'boolean',
        description: 'whether to validate responses. If true, and the request includes an `X-Validate-Response true` header, the response will be validated'
      }
    },
    required: ['apiSpec']
  },
  policy: ({ apiSpec, validateRequests, validateResponses }) => {
    logger.info(`Initializing validator for ${apiSpec}`)
    const openApiDocument = jsYaml.safeLoad(
      fs.readFileSync(apiSpec, 'utf-8')
    )
    const validator = new OpenApiValidator(openApiDocument, { ajvOptions: { coerceTypes: true } })
    const middlewareStack = []
    if (validateRequests) {
      middlewareStack.push(((handler) =>
        (req, res, next) => {
          handler(req, res, (err) => {
            if (err instanceof ValidationError) {
              res.setHeader('content-type', 'application/json')
              res.status(400) // Bad Request
                .send(JSON.stringify({ message: err.message, data: err.data }))
            } else if (err instanceof Error) {
              res.setHeader('content-type', 'text/plain')
              res.status(500) // Internal error
                .send(err.message)
            } else {
              next(err)
            }
          })
        }
      )(validator.match()))
    }
    if (validateResponses) {
      const paths = Object.keys(validator._document.paths).map(path => ({
        path,
        regex: pathToRegexp(oasPathToExpressPath(path))
      }))
      middlewareStack.push(
        modifyResponse(
          (req, res) => {
            // This should return true if the response body is to be validated
            return req.headers['x-validate-response'] === 'true'
          },
          (req, res, body) => {
            try {
              // find request path in schema document
              const match = paths.find(({ regex }) => regex.test(req.path))
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
                res.statusCode = 502 // Bad Gateway
                res.setHeader('content-type', 'application/json')
                return JSON.stringify({
                  message: e.message,
                  data: e.data
                })
              } else {
                res.statusCode = 500 // Internal error
                res.setHeader('content-type', 'text/plain')
                return e.message
              }
            }
            return body
          }
        )
      )
    }
    middlewareStack.unshift(bodyParser.urlencoded({ extended: false }))
    middlewareStack.unshift(bodyParser.text())
    middlewareStack.unshift(bodyParser.json())
    return squashMiddlewareStack(middlewareStack)
  }
}
