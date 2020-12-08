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

const makeValidateRequestMiddleware = (validator) => {
  const handler = validator.match()

  return (req, res, next) => {
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

    // standard request validation using Express OpenAPI Validate
    handler(req, res, (err) => {
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
