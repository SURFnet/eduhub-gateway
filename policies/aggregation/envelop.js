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

// Create an aggregated envelope response body. This contains the
// response headers and status of every response, plus the response
// body (JSON data) of all the OK responses.
const packageResponses = (req, responses) => {
  // Parse body of OK responses before proceeding.
  //
  // We need parsed JSON in order to merge the data with the envelope
  // response (OK responses are returned in aggregate).
  //
  // If we encounter invalid JSON, we set the status to
  // BadGateway. This also means we skip that response in the
  // aggregate (treating it as an error response).
  responses.forEach(
    ([{ id, url }, res]) => {
      if (res.statusCode === httpcode.OK) {
        try {
          res.parsedBody = JSON.parse(res.body)
        } catch (err) {
          logger.warn(`can not parse JSON response for ${id} ${url}: `, err)
          res.statusCode = httpcode.BadGateway
        }
      }
    }
  )

  // Build envelope
  return {
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
      (m, [{ id }, { parsedBody }]) => {
        m[id] = parsedBody
        return m
      }, {}
    )
  }
}

module.exports = { packageResponses }
