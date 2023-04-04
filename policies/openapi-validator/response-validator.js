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

const { pathToRegexp } = require('path-to-regexp')
const modifyResponse = require('express-modify-response')

const { oasPathToExpressPath } = require('express-openapi-validate/dist/schema-utils')

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

const makeValidator = (validatorFn) => {
  return (req, res, body) => {
    const validator = validatorFn()
    const matchers = pathMatchers(validator)

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
      res.statusCode = httpcode.BadGateway
      res.setHeader('content-type', 'application/json')
      return JSON.stringify({
        message: e.message,
        data: e.data
      })
    }
    return body
  }
}

const makeValidateResponseMiddleware = (validator) => {
  return modifyResponse(
    (req, res) => {
      // This should return true if the response body is to be validated
      return res.statusCode === httpcode.OK && req.headers['x-validate-response'] === 'true'
    },
    makeValidator(validator)
  )
}

module.exports = { makeValidateResponseMiddleware }
