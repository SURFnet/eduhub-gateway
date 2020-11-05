const fs = require('fs')
const jsYaml = require('js-yaml')

const logger = require('express-gateway/lib/logger').createLoggerWithLabel('[OAGW:Validator]')
const { OpenApiValidator } = require('express-openapi-validate')

const { squashMiddlewareStack } = require('../../lib/utils.js')
const { makeValidateRequestMiddleware } = require('./request-validator')
const { makeValidateResponseMiddleware } = require('./response-validator')

module.exports = ({ apiSpec, validateRequests, validateResponses }) => {
  logger.info(`Initializing validator for ${apiSpec}`)

  const openApiDocument = jsYaml.safeLoad(fs.readFileSync(apiSpec, 'utf-8'))
  const validator = new OpenApiValidator(openApiDocument, { ajvOptions: { coerceTypes: true } })

  const middlewareStack = []

  if (validateRequests) {
    middlewareStack.push(makeValidateRequestMiddleware(validator))
  }
  if (validateResponses) {
    middlewareStack.push(makeValidateResponseMiddleware(validator))
  }

  return squashMiddlewareStack(middlewareStack)
}
