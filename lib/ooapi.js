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

module.exports = {
  ooapiVersionFromRequest: ({ headers: { accept } }) => {
    if (!accept) return null

    if (accept.match(/^application\/json\b.*/)) return '5'

    const m = accept.match(/^application\/vnd\.oeapi\+json\s*;\s*version=(\d+)\b.*/)
    if (m) return m[1]

    return undefined
  }
}
