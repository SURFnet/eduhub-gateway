const logger = require('express-gateway/lib/logger').createLoggerWithLabel('[OAGW:Validator]')
const validator = require('express-openapi-validator')
const bodyParser = require('body-parser')
const { squashMiddlewareStack } = require('../lib/utils.js')

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
    logger.info(`Instantiating validator for spec ${apiSpec}, ${validateRequests}, ${validateResponses}`)
    const middlewareStack = validator.middleware({ apiSpec, validateRequests, validateResponses })
    middlewareStack.unshift(bodyParser.urlencoded({ extended: false }))
    middlewareStack.unshift(bodyParser.text())
    middlewareStack.unshift(bodyParser.json())
    return squashMiddlewareStack(middlewareStack)
  }
}
