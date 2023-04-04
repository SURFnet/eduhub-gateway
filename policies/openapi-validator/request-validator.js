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

const { ValidationError } = require('express-openapi-validate')

const httpcode = require('../../lib/httpcode')

const makeValidateRequestMiddleware = (validatorFn) => {
  return (req, res, next) => {
    validatorFn().match()(req, res, (err) => {
      if (err instanceof ValidationError) {
        res.set('content-type', 'application/json')
        res.status(httpcode.BadRequest)
        res.send(JSON.stringify({ message: err.message, data: err.data }))
      } else if (err instanceof Error) {
        res.set('content-type', 'text/plain')
        res.status(httpcode.InternalServerError)
        res.send(err.message)
      } else {
        next(err)
      }
    })
  }
}

module.exports = { makeValidateRequestMiddleware }
