#!/usr/bin/env node

/* Copyright (C) 2021 SURFnet B.V.
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

// This backend expects a "sleep" query parameter with the amount of
// milliseconds to sleep before responding.

const fs = require('fs')
const express = require('express')

const run = (port) => {
  const app = express()
  let shutdown = false

  app.get('/', (request, response) => {
    const { query: { sleep } } = request
    const deadline = (new Date().getTime()) + parseInt(sleep)

    const sleeper = () => {
      const now = new Date().getTime()

      if (deadline > now && !shutdown) {
        setTimeout(sleeper, 100)
      } else {
        response.send('"huh?"')
      }
    }

    setTimeout(sleeper, 0)
  })

  const srv = app.listen(port)
  return {
    close: () => {
      shutdown = true
      return srv.close()
    }
  }
}

if (fs.realpathSync(process.argv[1]) === fs.realpathSync(__filename)) {
  console.log('Starting SlowBackend..')
  run(8086)
}

module.exports = { run }
