/* eslint-env mocha */

const assert = require('assert')
const httpcode = require('../lib/httpcode')
const { httpGet, gwContainer, integrationContext } = require('./integration.environment.js')

// As reflected in config/credentials.json.test
const testCredentials = {
  fred: 'fred:96557fbdbcf0ac9d83876f17165c0f16',
  barney: 'barney:df9b24c6f9f412f73b70579b049ff993'
}

integrationContext('example policy', function () {
  it('should respond with Unauthorized without credentials', async () => {
    const port = gwContainer().getMappedPort(8080)
    const res = await httpGet(`http://localhost:${port}/example`)
    assert.strictEqual(res.statusCode, httpcode.Unauthorized)
  })

  it('should respond with Unauthorized with bad credentials', async () => {
    const port = gwContainer().getMappedPort(8080)
    const res = await httpGet(`http://localhost:${port}/example`, {
      auth: 'bad:credentials'
    })
    assert.strictEqual(res.statusCode, httpcode.Unauthorized)
  })

  it('should respond with BadRequest with auth but without example header', async () => {
    const port = gwContainer().getMappedPort(8080)
    const res = await httpGet(`http://localhost:${port}/example`, {
      auth: testCredentials.fred,
      headers: { 'X-Route': 'endpoint=TestBackend' }
    })
    assert.strictEqual(res.statusCode, httpcode.BadRequest)
  })

  it('should respond with OK with auth and example header', async () => {
    const port = gwContainer().getMappedPort(8080)
    const res = await httpGet(`http://localhost:${port}/example`, {
      auth: testCredentials.fred,
      headers: {
        'X-Route': 'endpoint=TestBackend',
        Example: true
      }
    })
    assert.strictEqual(res.statusCode, httpcode.OK)
  })
})
