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

const httpcode = require('../../lib/httpcode')

// OpenApiValidator throws generic Error exceptions when no matching
// method or path can be found. The `allowNoMatch` is broken and would
// let not matching requests pass.

const NO_MATCH_RE = /\b(method|path)=/i

const isMatchError = (err) => (
  err instanceof Error && err.message && NO_MATCH_RE.test(err.message)
)

const sendBadRequest = (res, err) => {
  res.set('content-type', 'application/json')
  res.status(httpcode.BadRequest)
  res.send(JSON.stringify({ message: err.message, data: err.data }))
  res.error_msg = err.message // we log res.error_msg in lifecycle logger
}

const makeValidateRequestMiddleware = (validatorFn) => {
  return (req, res, next) => {
    try {
      validatorFn().match()(req, res, (err) => {
        if (err !== undefined) {
          // err is always a ValidationError object
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

module.exports = { makeValidateRequestMiddleware }
