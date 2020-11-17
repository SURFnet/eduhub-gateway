/* eslint-env mocha */

const assert = require('assert').strict
const httpcode = require('../../lib/httpcode')

const {
  httpGet,
  integrationContext,
  gatewayUrl
} = require('../integration.environment.js')

integrationContext('aggregation policy', function () {
  it('should respond with an envelop', async () => {
    const res = await httpGet(gatewayUrl('fred', '/'))
    assert.equal(res.statusCode, httpcode.OK)
    assert.match(res.headers['content-type'], /^application\/json\b/)

    const body = JSON.parse(res.body)
    assert(body.gateway)
    assert(body.responses)

    assert.equal(body.gateway.request, '/')

    assert.deepEqual(
      body.gateway.endpoints,
      {
        TestBackend: {
          url: 'http://test-backend/',
          responseCode: httpcode.OK
        },
        OtherTestBackend: {
          url: 'http://test-backend2/',
          responseCode: httpcode.OK
        }
      }
    )

    assert.deepEqual(body.responses, {
      TestBackend: {
        contactEmail: 'user@example.com',
        specification: 'http://example.com',
        documentation: 'http://example.com'
      },
      OtherTestBackend: {
        contactEmail: 'admin@example.com',
        specification: 'http://data2.example.com',
        documentation: 'http://data2.example.com'
      }
    })
  })

  describe('combined with validation', () => {
    it('should not respond with an envelop with one endpoint', async () => {
      const res = await httpGet(gatewayUrl('fred', '/'), {
        headers: {
          'X-Validate-Response': 'true',
          'X-Route': 'endpoint=TestBackend'
        }
      })
      assert.equal(res.statusCode, httpcode.OK)
      assert.match(res.headers['content-type'], /^application\/json\b/)

      const body = JSON.parse(res.body)
      assert(!body.gateway)
      assert(!body.endpoint)
    })

    it('should respond with bad request for multiple endpoints', async () => {
      const res = await httpGet(gatewayUrl('fred', '/'), {
        headers: {
          'X-Validate-Response': 'true',
          'X-Route': 'endpoint=TestBackend,OtherTestBackend'
        }
      })
      assert.equal(res.statusCode, httpcode.BadRequest)
    })
  })
})
