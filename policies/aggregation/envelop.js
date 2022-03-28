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

const logger = require('express-gateway-lite/lib/logger').createLoggerWithLabel('[OAGW:Aggregation]')

const httpcode = require('../../lib/httpcode')

const urlJoin = (...parts) => (
  parts.map(part => part.replace(/^\/+/, '').replace(/\/$/, '')).join('/')
)

const packageResponses = (req, responses) => ({
  gateway: {
    requestId: req.egContext.requestID,
    request: req.url,
    endpoints: responses.reduce((m, [endpoint, res]) => {
      m[endpoint.id] = {
        name: endpoint.name,
        url: urlJoin(endpoint.url, req.url),
        responseCode: res.statusCode || 0,
        headers: res.headers
      }
      return m
    }, {})
  },

  responses: responses.filter(
    ([, res]) => res.statusCode === httpcode.OK
  ).reduce(
    (m, [{ id }, { body }]) => {
      try {
        m[id] = JSON.parse(body)
      } catch (err) {
        logger.warn('can not parse response: ', err)
        m[id] = null
      }
      return m
    }, {}
  )
})

module.exports = { packageResponses }
