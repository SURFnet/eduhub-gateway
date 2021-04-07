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

// Given a collection of headerNames, returns a function
// that removes all non listed headers from a header map

const keepHeadersFilter = (headerNames) => {
  const keepSet = new Set(headerNames.map(s => s.toLowerCase()))
  return (headers) => {
    Object.keys(headers).forEach(h => {
      if (!keepSet.has(h.toLowerCase())) {
        delete headers[h]
      }
    })
  }
}

module.exports = { keepHeadersFilter }
