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

const fs = require('fs')
const path = require('path')

const logger = require('express-gateway/lib/logger').createLoggerWithLabel('[OAGW:Credentials]')

const configFile = (filename) => path.join(__filename, `../../../config/${filename}`)
const defaultCredentialsFile = configFile('credentials.json')

let credentials = null

const watch = (filename) => {
  const file = filename ?? defaultCredentialsFile

  try {
    fs.watch(file, { persistent: false }, () => { credentials = null })
    logger.info(`watching credentials: ${file}`)

    if (fs.statSync(file).mode & 0o004) {
      logger.warn(`credentials file world readable: ${file}`)
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.warn(`can't watch ${file}: ${err}`)
    }
  }
}

const read = (filename) => {
  if (!credentials) {
    const file = filename ?? defaultCredentialsFile
    try {
      logger.debug('loading credentials')
      credentials = JSON.parse(fs.readFileSync(file))
    } catch (err) {
      if (err.code === 'ENOENT') {
        credentials = {}
      } else {
        logger.error(`can't read from ${file}: ${err}`)
        process.exit(1)
      }
    }
  }

  return credentials
}

const write = (newCredentials) => {
  try {
    fs.writeFileSync(
      defaultCredentialsFile,
      JSON.stringify(credentials, null, 2),
      { mode: 0o600 }
    )

    credentials = newCredentials
  } catch (err) {
    logger.error(`can't write to ${defaultCredentialsFile}: ${err}`)
    process.exit(1)
  }
}

module.exports = { watch, read, write }
