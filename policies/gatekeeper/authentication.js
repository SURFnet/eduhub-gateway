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

const crypto = require('crypto')

const hashPassword = (pass, salt) => (
  crypto.createHash('sha256').update(`${pass}-${salt}`).digest('hex')
)

const appFromRequest = (req, apps) => {
  const { headers: { authorization } } = req
  const [, credEncoded] = (authorization || '').match(/^Basic\s+(.*)/) || []

  if (credEncoded) {
    const cred = Buffer.from(credEncoded, 'base64').toString('utf-8')
    const [, user, pass] = cred.match(/^([^:]+):(.*)/) || []
    const app = apps[user]

    if (app && hashPassword(pass, app.passwordSalt) === app.passwordHash) {
      return user
    }
  }

  return null
}

module.exports = {
  hashPassword,
  appFromRequest
}
