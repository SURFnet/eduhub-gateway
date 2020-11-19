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

/* eslint-env mocha */

const https = require('https')
const http = require('http')
const path = require('path')
const { GenericContainer, TestContainers, Wait } = require('testcontainers')

let container, testBackend, otherTestBackend
const skipTest = process.env.MOCHA_SKIP === 'integration'

// As reflected in config/credentials.json.test
const testCredentials = {
  fred: 'fred:96557fbdbcf0ac9d83876f17165c0f16',
  barney: 'barney:df9b24c6f9f412f73b70579b049ff993'
}

module.exports = {
  up: async () => {
    if (skipTest) return

    testBackend = require('../scripts/test-backend.js')
    otherTestBackend = require('../scripts/other-test-backend.js')

    await TestContainers.exposeHostPorts(8082, 8083)

    const composeFilePath = path.resolve(__dirname, '..')
    const composeFile = 'Dockerfile.test'
    const image = await GenericContainer
      .fromDockerfile(composeFilePath, composeFile)
      .build()

    container = await image
      .withEnv('OOAPI_TEST_BACKEND_URL', 'http://host.testcontainers.internal:8082')
      .withEnv('OOAPI_OTHER_TEST_BACKEND_URL', 'http://host.testcontainers.internal:8083')
      .withWaitStrategy(Wait.forLogMessage('gateway https server listening'))
      .withExposedPorts(8080, 4444)
      .start()
  },

  down: async () => {
    if (skipTest) return
    await container.stop()

    testBackend.close()
    otherTestBackend.close()
  },

  integrationContext: (description, callback) => {
    if (skipTest) {
      describe.skip(description, callback)
    } else {
      describe(description, callback)
    }
  },

  skipTest: skipTest,

  httpGet: (url, opts) => {
    const lib = url.startsWith('https://') ? https : http
    opts = Object.assign({
      agent: false, // allow self-signed certificates
      rejectUnauthorized: false
    }, opts)
    return new Promise(
      (resolve, reject) => lib.get(url, opts, res => {
        let body = ''
        res.on('data', (chunk) => { body += chunk })
        res.on('end', () => {
          res.body = body
          resolve(res)
        })
      })
    )
  },

  testCredentials,

  gatewayUrl: (app, path) => {
    const auth = app ? testCredentials[app] + '@' : ''
    return `https://${auth}localhost:${container.getMappedPort(4444)}${path || ''}`
  }
}
