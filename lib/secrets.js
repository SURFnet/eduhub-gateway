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

const fs = require('fs')
const crypto = require('crypto')

const cipherAlgorithm = 'aes-192-cbc'

// file containing a 192 bit secret in hexadecimal
let key
try {
  key = fs.readFileSync(process.env.SECRETS_KEY_FILE, 'utf8').trim()
} catch (err) {
  throw new Error('Expecting SECRETS_KEY_FILE environment variable to point to file containing secret key')
}
if (!key.match(/^[0-9a-f]{48}$/i)) {
  throw new Error('Expecting key in SECRETS_KEY_FILE be contain a 192 bit hexadecimal')
}

function hexToBytes (hex) {
  const buf = Buffer.alloc(hex.length / 2)
  for (let i = 0; i < hex.length / 2; i += 1) {
    buf[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return buf
}

function bytesToHex (buf) {
  let hex = ''
  for (let i = 0; i < buf.length; i += 1) {
    if (buf[i] < 16) hex += 0
    hex += buf[i].toString(16)
  }
  return hex
}

function encrypt (text) {
  return new Promise((resolve, reject) => {
    crypto.randomFill(new Uint8Array(16), (err, iv) => {
      if (err) reject(err)

      const cipher = crypto.createCipheriv(
        cipherAlgorithm,
        hexToBytes(key),
        iv
      )
      cipher.setEncoding('base64')

      let encrypted = bytesToHex(iv) + ':'
      cipher.on('data', (chunk) => { encrypted += chunk })
      cipher.on('end', () => resolve(encrypted))

      cipher.write(text)
      cipher.end()
    })
  })
}

function decrypt (encrypted) {
  return new Promise((resolve, reject) => {
    const [iv, text] = encrypted.split(':')
    const decipher = crypto.createDecipheriv(
      cipherAlgorithm,
      hexToBytes(key),
      hexToBytes(iv)
    )

    let result = ''
    decipher.on('readable', () => {
      let chunk
      while ((chunk = decipher.read()) !== null) {
        result += chunk.toString('utf8')
      }
    })
    decipher.on('end', () => { resolve(result) })

    decipher.write(text, 'base64')
    decipher.end()
  })
}

function encode (data) {
  return encrypt(JSON.stringify(data))
}

async function decode (data) {
  return JSON.parse(await decrypt(data))
}

module.exports = {
  encrypt,
  decrypt,
  encode,
  decode
}
