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

const { URL } = require('url')
const httpcode = require('../../lib/httpcode')

const packageResponses = (req, responses) => ({
  gateway: {
    requestId: req.egContext.requestID,
    request: req.url,
    endpoints: responses.reduce((m, [endpoint, res]) => {
      m[endpoint.id] = {
        name: endpoint.name,
        url: new URL(req.url, endpoint.url).toString(),
        responseCode: res.statusCode || 0
      }
      return m
    }, {})
  },

  responses: responses.filter(
    ([, res]) => res.statusCode === httpcode.OK
  ).reduce(
    (m, [{ id }, { body }]) => {
      m[id] = JSON.parse(body)
      return m
    }, {}
  )
})

module.exports = { packageResponses }
