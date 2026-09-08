/* Copyright (C) 2026 SURFnet B.V.
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
const { OpenApiValidator } = require('express-openapi-validate')

const httpcode = require('../../lib/httpcode')
const { ooapiVersionFromRequest } = require('../../lib/ooapi')

const sendNotAcceptable = (res, message) => {
  res.setHeader('content-type', 'application/json')
  res.status(httpcode.NotAcceptable)
  res.send(JSON.stringify({ message }))
  res.error_msg = message // we log res.error_msg in lifecycle logger
}

const sendBadRequest = (res, err) => {
  res.setHeader('content-type', 'application/json')
  res.status(httpcode.BadRequest)
  res.send(JSON.stringify({ message: err.message, data: err.data }))
  res.error_msg = err.message // we log res.error_msg in lifecycle logger
}

const NO_MATCH_RE = /\b(method|path)=/i

const isMatchError = (err) => (
  err instanceof Error && err.message && NO_MATCH_RE.test(err.message)
)

module.exports = ({ apiSpecs }) => {
  const validatorFns = {}
  Object.keys(apiSpecs).forEach(version => {
    const openApiDocument = jsYaml.load(fs.readFileSync(apiSpecs[version], 'utf-8'))
    validatorFns[version] = () => (
      new OpenApiValidator(
        openApiDocument,
        {
          ajvOptions: {
            coerceTypes: 'array',
            formats: {
              uuid: true,
              uri: true,
              email: true
            },
            allErrors: true
          }
        }
      )
    )
  })

  return (req, res, next) => {
    const version = ooapiVersionFromRequest(req)

    if (!version) {
      sendNotAcceptable(res, 'No OOAPI version detected')
      return
    }

    if (!apiSpecs[version]) {
      sendNotAcceptable(res, `OOAPI version ${version} not supported`)
      return
    }

    try {
      validatorFns[version]().match()(req, res, (err) => {
        if (err !== undefined) {
          sendBadRequest(res, err)
        } else {
          next()
        }
      })
    } catch (err) {
      if (isMatchError(err)) {
        sendBadRequest(res, err)
      } else {
        throw err
      }
    }
  }
}
