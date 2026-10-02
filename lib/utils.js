/* Copyright (C) 2020-2026 SURFnet B.V.
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

const httpcode = require('./httpcode')

module.exports = {
  sendNotAcceptable: (res, err) => {
    res.setHeader('content-type', 'application/json')
    res.status(httpcode.NotAcceptable)
    res.send(JSON.stringify(err))
    res.error_msg = err.message // we log res.error_msg in lifecycle logger
  },

  sendBadRequest: (res, err) => {
    res.setHeader('content-type', 'application/json')
    res.status(httpcode.BadRequest)
    res.send(JSON.stringify(err))
    res.error_msg = err.message // we log res.error_msg in lifecycle logger
  }
}
