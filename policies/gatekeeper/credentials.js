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

const logger = require('express-gateway/lib/logger').createLoggerWithLabel('[OAGW:Credentials]')

const defaultCredentialsFile = 'config/credentials.json'

class Store {
  constructor (filename) {
    this.file = filename ?? defaultCredentialsFile
  }

  watch () {
    try {
      fs.watch(this.file, {
        persistent: false
      }, () => {
        this.credentials = null
      })
      logger.info(`watching credentials: ${this.file}`)

      if (fs.statSync(this.file).mode & 0o004) {
        logger.warn(`credentials file world readable: ${this.file}`)
      }
    } catch (err) {
      if (err.code !== 'ENOENT') {
        logger.warn(`can't watch ${this.file}: ${err}`)
      }
    }
  }

  read () {
    if (!this.credentials) {
      try {
        logger.debug('loading credentials')
        this.credentials = JSON.parse(fs.readFileSync(this.file))
      } catch (err) {
        if (err.code === 'ENOENT') {
          this.credentials = {}
        } else {
          logger.error(`can't read from ${this.file}: ${err}`)
          process.exit(1)
        }
      }
    }

    return ({ ...this.credentials })
  }

  write (creds) {
    try {
      fs.writeFileSync(
        this.file,
        JSON.stringify(creds, null, 2),
        { mode: 0o600 }
      )

      this.credentials = creds
    } catch (err) {
      logger.error(`can't write to ${this.file}: ${err}`)
      process.exit(1)
    }
  }
}

module.exports = { Store }
