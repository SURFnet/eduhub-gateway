/* eslint-env mocha */

const assert = require('assert').strict

const { httpGet, integrationContext, gatewayUrl } = require('./integration.environment.js')

integrationContext('rate limiting', function () {
  it('should be able to get no more than 10 requests/second', async () => {
    const promises = []
    for (var i = 0; i < 20; i++) {
      promises.push(httpGet(gatewayUrl(null, '/courses')))
    }
    const results = await Promise.all(promises)
    assert.ok(results.some((r) => r.statusCode === 429)) // Too many requests
  })
})
