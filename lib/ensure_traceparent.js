/* Copyright (C) 2023 SURFnet B.V.
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

const traceParent = require('traceparent')

// This function sets and returns a TraceParent object on the
// `traceparent` attribute of request.  The TraceParent object is
// initiated from the `traceparent` header in request (if
// present). Otherwise a new TraceParent object is initialized.

module.exports = (req) => {
  req.traceparent ||= traceParent.startOrResume(
    req.headers.traceparent, {
      transactionSampleRate: 0.0
    }
  )
  return req.traceparent
}
