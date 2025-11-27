/* Copyright (C) 2020, 2021 SURFnet B.V.
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

// Returns hex digest of password hashed using SHA256 with salt.
//
// This is a timing safe function because the password and salt are
// set to be 32 character strings by either truncating to or repeating
// up until a length of 32 characters.  The process of truncation and
// repetition assumes no interference by the runtime JIT.
const hashPassword = (pass, salt) => {
  let data = ''
  for (let i = 0; i < 32; i++) {
    data += pass.charAt(i % pass.length)
  }
  data += '-'
  for (let i = 0; i < 32; i++) {
    data += salt.charAt(i % salt.length)
  }
  return crypto.createHash('sha256').update(data).digest('hex')
}

// Returns a DataView on a 64 characters ASCII string (SHA256 hash hex
// digest).
const hashToDataView = (s) => {
  const buffer = new ArrayBuffer(64)
  const view = new DataView(buffer)
  for (let i = 0; i < 64; i++) {
    view.setUint8(i, s.charCodeAt(i % s.length))
  }
  return view
}

// Timing safe equals on two 64 character ASCII strings (SHA256 hash
// hex digests).
const timingSafeHashEqual = (s1, s2) => (
  crypto.timingSafeEqual(hashToDataView(s1), hashToDataView(s2))
)

// Dummy values to do work on when no matching date is provided.
const dummyPass = '0123456789abcdef0123456789abcdef'
const dummySalt = '0123456789abcdef0123456789abcdef'
const dummyHash = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

const appFromRequest = (req, apps) => {
  const { headers: { authorization } } = req
  const [, credEncoded] = (authorization || '').match(/^Basic\s+(.*)/) || []

  if (credEncoded) {
    const cred = Buffer.from(credEncoded, 'base64').toString('utf-8')
    const [, user, password] = cred.match(/^([^:]+):(.*)/) || []
    const app = apps[user]

    const pass = password || dummyPass
    const salt = app ? app.passwordSalt : dummySalt
    const hash = app ? app.passwordHash : dummyHash

    if (timingSafeHashEqual(hashPassword(pass, salt), hash)) {
      return { ...app, user }
    }
  }

  return null
}

module.exports = {
  hashPassword,
  appFromRequest
}
