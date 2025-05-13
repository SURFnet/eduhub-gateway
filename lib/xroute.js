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

const lodash = require('lodash')

class MalformedHeader extends Error {}

const encode = (endpoints) => (
  `endpoint=${endpoints.join(',')}`
)

const decode = (xroute, throwOnMalformed = false) => {
  if (xroute) {
    // Note: an endpoint ID may only contain a-z, A-Z, 0-9, . and - characters
    const [, endpoints] = /\s*endpoint\s*=\s*((?:[a-zA-Z0-9.-]+(?:\s*,\s*)?)*)\s*$/.exec(xroute) || []
    if (endpoints) {
      return lodash.uniq(endpoints.trim().split(/\s*,\s*/))
    } else if (throwOnMalformed) {
      throw new MalformedHeader(xroute)
    }
  }
  return null
}

module.exports = { encode, decode, MalformedHeader }
