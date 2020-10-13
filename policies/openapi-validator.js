const logger = require('express-gateway/lib/logger').createLoggerWithLabel('[OAGW:Validator]')
const { OpenApiValidator, ValidationError } = require('express-openapi-validate')
const bodyParser = require('body-parser')
const fs = require('fs')
const jsYaml = require('js-yaml')
const { squashMiddlewareStack } = require('../lib/utils.js')
const modifyResponse = require('express-modify-response')

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
        description: 'whether to validate responses'
      }
    },
    required: ['apiSpec']
  },
  policy: ({ apiSpec, validateRequests, validateResponses }) => {
    logger.info(`Initializing validator for ${apiSpec}`)
    const openApiDocument = jsYaml.safeLoad(
      fs.readFileSync(apiSpec, 'utf-8')
    )
    const validator = new OpenApiValidator(openApiDocument)
    const middlewareStack = []
    if (validateRequests) {
      middlewareStack.push(validator.match())
    }
    if (validateResponses) {
      middlewareStack.push(
        modifyResponse(
          (req, res) => {
            // This should return true if the response body is to be validated
            return true
          },
          (req, res, body) => {
            try {
              validator.validateResponse(req.method.toLowerCase(), req.path)(
                {
                  statusCode: res.statusCode,
                  headers: res.getHeaders(),
                  body: JSON.parse(body.toString())
                }
              )
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
