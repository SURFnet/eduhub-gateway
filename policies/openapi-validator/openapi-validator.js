/* Copyright (C) 2020 SURFnet B.V.
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program. If not, see http://www.gnu.org/licenses/.
 */

const fs = require('fs')
const jsYaml = require('js-yaml')

const logger = require('express-gateway/lib/logger').createLoggerWithLabel('[OAGW:Validator]')
const { OpenApiValidator } = require('express-openapi-validate')

const { squashMiddlewareStack } = require('../../lib/utils.js')
const { makeValidateRequestMiddleware } = require('./request-validator')
const { makeValidateResponseMiddleware } = require('./response-validator')

module.exports = ({ apiSpec, validateRequests, validateResponses }) => {
  logger.info(`initializing validator for ${apiSpec}`)

  const openApiDocument = jsYaml.safeLoad(fs.readFileSync(apiSpec, 'utf-8'))
  const validator = new OpenApiValidator(openApiDocument, { ajvOptions: { coerceTypes: true } })

  const middlewareStack = []

  if (validateRequests) {
    middlewareStack.push((req, res, next) => {
      // HACK!
      //
      // The ooapi v4 specifies an `expand` query parameter that
      // should be an array.
      //
      // You pass multiple values for `expand` in the standard HTML form way by
      // specifying the parameter multiple times:
      //
      // /courses/900d900d-900d-900d-900d-900d900d900d?expand=programs&expand=coordinator
      //
      // This is then parsed as an array ["programs","coordinator"] by the
      // gateway middleware and validated correctly.
      //
      // When only a single value is passed you should provide a single
      // parameter:
      //
      // /courses/900d900d-900d-900d-900d-900d900d900d?expand=programs
      //
      // The standard middleware will turn this in a single string "programs"
      // and the validator will complain.
      //
      // Since there is only a single array query parameter in the openapi spec
      // we work around the issue by turning any non-array "expand" parameter
      // into an array right before validating the request.
      if (req.query.expand && !Array.isArray(req.query.expand)) {
        req.query.expand = [req.query.expand]
      }
      next()
    })
    middlewareStack.push(makeValidateRequestMiddleware(validator))
  }
  if (validateResponses) {
    middlewareStack.push(makeValidateResponseMiddleware(validator))
  }

  return squashMiddlewareStack(middlewareStack)
}
