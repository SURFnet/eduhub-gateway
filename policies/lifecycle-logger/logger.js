/* Copyright (C) 2021 SURFnet B.V.
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

const jsonLog = require('../../lib/json_log')

module.exports = () => {
  return (req, res, next) => {
    const reqTimerStart = new Date()
    const method = req.method
    const url = req.originalUrl
    res.on('finish', () => {
      const app = req.egContext.app // set by gatekeeper policy
      const requestId = req.egContext.requestID
      const reqTimerEnd = new Date()
      const statusCode = res.statusCode
      jsonLog.info({
        short_message: `${requestId} - ${method} ${url} ${statusCode}`,
        trace_id: requestId,
        client: app,
        http_status: statusCode,
        request_method: method,
        url: url,
        time_ms: reqTimerEnd - reqTimerStart
      })
    })
    next()
  }
}
