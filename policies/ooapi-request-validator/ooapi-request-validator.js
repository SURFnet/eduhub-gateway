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

const { ooapiVersionFromRequest } = require('../../lib/ooapi')
const { sendBadRequest, sendNotAcceptable } = require('../../lib/utils')

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

    // Note: accept header for version will be provided by
    // authorization.prepareRequestHeaders when not in the original
    // request.
    if (!version) {
      throw new Error('Internal error: missing OOAPI version, gatekeeper policy missing or misplaced')
    }

    if (!apiSpecs[version]) {
      sendNotAcceptable(res, { message: `OOAPI version ${version} not supported` })
      return
    }

    try {
      validatorFns[version]().match()(req, res, (err) => {
        if (err !== undefined) {
          sendBadRequest(res, { message: err, data: err.data })
        } else {
          next()
        }
      })
    } catch (err) {
      if (isMatchError(err)) {
        sendBadRequest(res, { message: err.message })
      } else {
        throw err
      }
    }
  }
}
