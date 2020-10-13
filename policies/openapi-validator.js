const logger = require('express-gateway/lib/logger').createLoggerWithLabel('[OAGW:Validator]')
const { OpenApiValidator } = require('express-openapi-validate')
const bodyParser = require('body-parser')
const fs = require('fs')
const jsYaml = require('js-yaml')
const { squashMiddlewareStack } = require('../lib/utils.js')
const mung = require('express-mung')

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
      logger.info('validating responses')
      middlewareStack.push((req, res, next) => {
        
        const oldWrite = res.write
        logger.info(`middleware called, replacing ${oldWrite}`)
        res.write = function (chunk) {
          logger.info('write', chunk)
          oldWrite.apply(res, arguments)
        }
        next()
      })
    }
    middlewareStack.unshift(bodyParser.urlencoded({ extended: false }))
    middlewareStack.unshift(bodyParser.text())
    middlewareStack.unshift(bodyParser.json())
    return squashMiddlewareStack(middlewareStack)
  }
}
