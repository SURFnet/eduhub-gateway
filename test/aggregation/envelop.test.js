/* eslint-env mocha */

const assert = require('assert').strict
const httpcode = require('../../lib/httpcode')
const envelop = require('../../policies/aggregation/envelop')

describe('envelop', () => {
  describe('packageResponses', () => {
    const req = {
      egContext: { requestID: 'test-request-id' },
      url: '/test-url?foo=bar'
    }
    const responses = [[
      { id: 'endpoint-1', name: 'endpoint-1-name', url: 'http://endpoint-1.org' },
      { statusCode: httpcode.OK, body: '{"foo": "bar"}' }
    ], [
      { id: 'endpoint-2', name: 'endpoint-2-name', url: 'http://endpoint-2.org' },
      { statusCode: httpcode.BadRequest, body: '{"foo": "bar"}' }
    ]]

    const resp = envelop.packageResponses(req, responses)

    it('has a gateway property', () => {
      assert.deepEqual(
        resp.gateway,
        {
          requestId: 'test-request-id',
          request: '/test-url?foo=bar',
          endpoints: {
            'endpoint-1': {
              name: 'endpoint-1-name',
              url: 'http://endpoint-1.org/test-url?foo=bar',
              responseCode: httpcode.OK
            },
            'endpoint-2': {
              name: 'endpoint-2-name',
              url: 'http://endpoint-2.org/test-url?foo=bar',
              responseCode: httpcode.BadRequest
            }
          }
        }
      )
    })

    it('has an responses property', () => {
      assert.deepEqual(
        resp.responses,
        { 'endpoint-1': { foo: 'bar' } }
      )
    })
  })
})
