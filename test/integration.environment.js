/* Copyright (C) 2020, 2023 SURFnet B.V.
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
const querystring = require('querystring')
const path = require('path')
const { GenericContainer, TestContainers, Wait } = require('testcontainers')

let gw, otherGw, testBackend, otherTestBackend, echoBackend, badBackend, slowBackend, mockOauth, redis
const skipTest = process.env.MOCHA_SKIP === 'integration'

const TEST_BACKEND_PORT = 9082
const OTHER_TEST_BACKEND_PORT = 9083
const MOCK_OAUTH_TOKEN_PORT = 9084
const TEST_ECHO_BACKEND_PORT = 9085
const TEST_BAD_BACKEND_PORT = 9086
const TEST_SLOW_BACKEND_PORT = 9087
const REDIS_PORT = 6379
const TEST_OOAPI_V5 = process.env.TEST_OOAPI_V5

const TEST_BACKEND_CONTAINER_URL = `http://host.testcontainers.internal:${TEST_BACKEND_PORT}/`
const TEST_BACKEND_URL = `http://localhost:${TEST_BACKEND_PORT}/`
const OTHER_TEST_BACKEND_CONTAINER_URL = `http://host.testcontainers.internal:${OTHER_TEST_BACKEND_PORT}/ooapi/`
const OTHER_TEST_BACKEND_URL = `http://localhost:${OTHER_TEST_BACKEND_PORT}/ooapi/`
const MOCK_OAUTH_TOKEN_CONTAINER_URL = `http://host.testcontainers.internal:${MOCK_OAUTH_TOKEN_PORT}/mock/token`
const MOCK_OAUTH_TOKEN_URL = `http://localhost:${MOCK_OAUTH_TOKEN_PORT}/mock/token`
const TEST_ECHO_BACKEND_CONTAINER_URL = `http://host.testcontainers.internal:${TEST_ECHO_BACKEND_PORT}/`
const TEST_ECHO_BACKEND_URL = `http://localhost:${TEST_ECHO_BACKEND_PORT}/`
const TEST_BAD_BACKEND_CONTAINER_URL = `http://host.testcontainers.internal:${TEST_BAD_BACKEND_PORT}/`
const TEST_BAD_BACKEND_URL = `http://localhost:${TEST_BAD_BACKEND_PORT}/`
const TEST_SLOW_BACKEND_CONTAINER_URL = `http://host.testcontainers.internal:${TEST_SLOW_BACKEND_PORT}/`
const TEST_SLOW_BACKEND_URL = `http://localhost:${TEST_SLOW_BACKEND_PORT}/`
const REDIS_HOST = 'host.testcontainers.internal'

// As reflected in config/credentials.json.test
const testCredentials = {
  fred: 'fred:96557fbdbcf0ac9d83876f17165c0f16',
  barney: 'barney:df9b24c6f9f412f73b70579b049ff993',
  bubbles: 'bubbles:06864d9f7974969d9c7af0f729f0129a'
}

const httpRequest = (url, { data, ...opts }) => {
  const lib = url.startsWith('https://') ? https : http

  // allow self-signed certificates
  opts = { ...opts, agent: false, rejectUnauthorized: false }

  return new Promise(
    (resolve, reject) => {
      try {
        const req = lib.request(url, opts, (res, req) => {
          let body = ''
          res.on('data', (chunk) => { body += chunk })
          res.on('end', () => {
            res.body = body
            resolve(res)
          })
        })
        if (data) req.write(data)
        req.end()
      } catch (err) {
        reject(err)
      }
    }
  )
}

const httpGet = (url, opts) => {
  return httpRequest(url, { ...opts, method: 'GET' })
}

const httpPost = (url, { params, ...opts }) => {
  const data = querystring.stringify(params)
  return httpRequest(url, {
    data,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(data)
    }
  })
}

module.exports = {
  up: async () => {
    if (skipTest) return

    testBackend = require('../scripts/test-backend').run(TEST_BACKEND_PORT)
    otherTestBackend = require('../scripts/other-test-backend').run(OTHER_TEST_BACKEND_PORT)
    mockOauth = require('../scripts/mock-oauth').run(MOCK_OAUTH_TOKEN_PORT)
    echoBackend = require('../scripts/echo-backend').run(TEST_ECHO_BACKEND_PORT)
    badBackend = require('../scripts/bad-backend').run(TEST_BAD_BACKEND_PORT)
    slowBackend = require('../scripts/slow-backend').run(TEST_SLOW_BACKEND_PORT)

    redis = await new GenericContainer('redis')
      .withWaitStrategy(Wait.forLogMessage('Ready to accept connections'))
      .withExposedPorts(REDIS_PORT)
      .start()

    const redisPort = redis.getMappedPort(REDIS_PORT)
    await TestContainers.exposeHostPorts(
      TEST_BACKEND_PORT,
      OTHER_TEST_BACKEND_PORT,
      MOCK_OAUTH_TOKEN_PORT,
      TEST_ECHO_BACKEND_PORT,
      TEST_BAD_BACKEND_PORT,
      TEST_SLOW_BACKEND_PORT,
      redisPort
    )

    const dockerFilePath = path.resolve(__dirname, '..')
    const dockerFile = 'Dockerfile'
    const image = await GenericContainer
      .fromDockerfile(dockerFilePath, dockerFile)
      .build()

    const startGw = async (name) => (
      image
        .withName(name)
        .withEnvironment({
          EG_GATEWAY_CONFIG_PATH: `/shared-config/gateway.config.v${TEST_OOAPI_V5 ? '5' : '4'}.yml`,
          OOAPI_TEST_BACKEND_URL: TEST_BACKEND_CONTAINER_URL,
          OOAPI_OTHER_TEST_BACKEND_URL: OTHER_TEST_BACKEND_CONTAINER_URL,
          MOCK_OAUTH_TOKEN_URL: MOCK_OAUTH_TOKEN_CONTAINER_URL,
          OOAPI_ECHO_BACKEND_URL: TEST_ECHO_BACKEND_CONTAINER_URL,
          OOAPI_BAD_BACKEND_URL: TEST_BAD_BACKEND_CONTAINER_URL,
          OOAPI_SLOW_BACKEND_URL: TEST_SLOW_BACKEND_CONTAINER_URL,
          LOG_LEVEL: process.env.LOG_LEVEL || 'info',
          REDIS_HOST,
          REDIS_PORT: redisPort,
          SECRETS_KEY_FILE: 'config/test-secret.txt'
        })
        .withWaitStrategy(Wait.forLogMessage('gateway http server listening'))
        .withExposedPorts(8080)
        .withStartupTimeout(5 * 60 * 1000)
        .withBindMounts([
          {
            source: path.join(__dirname, '/config'),
            target: '/shared-config',
            mode: 'rw'
          }
        ])
        .start()
    )

    gw = await startGw('ooapi-gateway' + TEST_OOAPI_V5)
    otherGw = await startGw('ooapi-othergateway' + TEST_OOAPI_V5)

    if (process.env.MOCHA_LOG_GW_TO_CONSOLE) {
      const stream = await gw.logs()
      stream
        .on('data', line => console.log(line))
        .on('err', line => console.error(line))
    }
  },

  down: async () => {
    if (skipTest) return
    await gw.stop()
    await otherGw.stop()
    await redis.stop()

    slowBackend.close()
    badBackend.close()
    echoBackend.close()
    testBackend.close()
    otherTestBackend.close()
    mockOauth.close()
  },

  integrationContext: (description, callback) => {
    if (skipTest) {
      describe.skip(description, callback)
    } else {
      describe(description, callback)
    }
  },

  skipTest,
  httpGet,
  httpPost,

  testCredentials,

  gatewayUrl: (app, path) => {
    const auth = app ? testCredentials[app] + '@' : ''
    return `http://${auth}localhost:${gw.getMappedPort(8080)}${path || ''}`
  },
  otherGatewayUrl: (app, path) => {
    const auth = app ? testCredentials[app] + '@' : ''
    return `http://${auth}localhost:${otherGw.getMappedPort(8080)}${path || ''}`
  },

  TEST_BAD_BACKEND_URL,
  TEST_BAD_BACKEND_CONTAINER_URL,
  TEST_SLOW_BACKEND_URL,
  TEST_SLOW_BACKEND_CONTAINER_URL,
  TEST_ECHO_BACKEND_URL,
  TEST_ECHO_BACKEND_CONTAINER_URL,
  TEST_BACKEND_CONTAINER_URL,
  TEST_BACKEND_URL,
  OTHER_TEST_BACKEND_CONTAINER_URL,
  OTHER_TEST_BACKEND_URL,
  MOCK_OAUTH_TOKEN_CONTAINER_URL,
  MOCK_OAUTH_TOKEN_URL,
  TEST_OOAPI_V5,

  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms))
}
