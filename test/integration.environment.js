/* eslint-env mocha */

const http = require('http')
const path = require('path')
const { DockerComposeEnvironment } = require('testcontainers')

let environment, gwContainer
const skipTest = process.env.MOCHA_SKIP === 'integration'

module.exports = {
  up: async () => {
    if (skipTest) return

    const composeFilePath = path.resolve(__dirname, '..')
    const composeFile = 'docker-compose.test.yml'

    environment = await new DockerComposeEnvironment(composeFilePath, composeFile)
      .up()
    gwContainer = environment.getContainer('surf-ooapi-gateway_gw-test_1')

    if (process.env.MOCHA_LOG_GW_TO_CONSOLE) {
      const stream = await gwContainer.logs()
      stream
        .on('data', line => console.log(line))
        .on('err', line => console.error(line))
    }
  },

  down: async () => {
    if (skipTest) return
    await environment.down()
  },

  gwContainer: () => {
    if (!gwContainer) {
      throw new Error('Integration environment not initialized!')
    }
    return gwContainer
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
    return new Promise(
      (resolve, reject) => http.get(url, opts, res => {
        let body = ''
        res.on('data', (chunk) => { body += chunk })
        res.on('end', () => {
          res.body = body
          resolve(res)
        })
      })
    )
  },

  // As reflected in config/credentials.json.test
  testCredentials: {
    fred: 'fred:96557fbdbcf0ac9d83876f17165c0f16',
    barney: 'barney:df9b24c6f9f412f73b70579b049ff993'
  }
}
