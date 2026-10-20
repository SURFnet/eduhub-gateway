/* Copyright (C) 2026 SURFnet B.V.
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

function isOoapiVersion5 ({ headers: { accept } }) {
  return accept?.match(/^application\/json(?:\s*;.*)?$/) && '5'
}

function isOoapiVersionOther ({ headers: { accept } }) {
  const m = accept?.match(/^(?:\*\/\*|application\/\*|application\/vnd\.oeapi\+json)\s*;\s*version=(\d+)\b.*/)
  if (m) return m[1]
  return null
}

function isOoapiVersionWildcard ({ headers: { accept } }) {
  return !accept || !!accept.match(/^(application|\*)\/\*$/)
}

module.exports = {
  isOoapiVersion5,
  isOoapiVersionOther,
  isOoapiVersionWildcard,

  // Return version as a string or true for a wildcard request and
  // false when not acceptable.
  ooapiVersionFromRequest: (req) => (
    isOoapiVersion5(req) || isOoapiVersionOther(req) || isOoapiVersionWildcard(req)
  )
}
