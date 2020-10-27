/* eslint-env mocha */

const assert = require('assert')
const gatekeeper = require('../policies/gatekeeper')

// As reflected in config/credentials.json.test
const testCredentials = {
  fred: 'fred:96557fbdbcf0ac9d83876f17165c0f16',
  barney: 'barney:df9b24c6f9f412f73b70579b049ff993'
}

describe('gatekeeper', () => {
  it('has a policy', () => {
    assert(gatekeeper.policy)
  })

  describe('policy', () => {
    const middleware = gatekeeper.policy({
      credentials: 'credentials.json.test',
      acls: [
        {
          app: 'fred',
          endpoints: [
            {
              endpoint: 'wilma',
              paths: ['/', '/dinner/:date']
            }
          ]
        }
      ]
    }, { gatewayConfig: { serviceEndpoints: { wilma: true } } })

    let calledNext, gotStatus, gotSet
    const res = { set: (v) => { gotSet = v }, sendStatus: (v) => { gotStatus = v } }
    const next = () => { calledNext = true }
    const auth = (cred) => `Basic ${Buffer.from(cred, 'utf-8').toString('base64')}`

    beforeEach(() => {
      calledNext = gotStatus = gotSet = undefined
    })

    it('returns 401 unauthorized without basic auth credentials', () => {
      middleware({ headers: {} }, res, next)
      assert(!calledNext)
      assert.strictEqual(gotStatus, 401)
      assert(gotSet['WWW-Authenticate'])
    })

    it('returns 401 unauthorized without known auth credentials', () => {
      middleware({ headers: { authorization: auth('foo:bar') } }, res, next)
      assert(!calledNext)
      assert.strictEqual(gotStatus, 401)
      assert(gotSet['WWW-Authenticate'])
    })

    it('returns 403 forbidden with known auth credentials but bad endpoint', () => {
      middleware({
        headers: {
          authorization: auth(testCredentials.fred),
          'x-route': 'endpoint=betty'
        },
        path: '/'
      }, res, next)
      assert(!calledNext)
      assert.strictEqual(gotStatus, 403)
    })

    it('returns 403 forbidden with known auth credentials but bad path', () => {
      middleware({
        headers: {
          authorization: auth(testCredentials.fred),
          'x-route': 'endpoint=wilma'
        },
        path: '/tv'
      }, res, next)
      assert(!calledNext)
      assert.strictEqual(gotStatus, 403)
    })

    it('calls next with known auth credentials, endpoint and path', () => {
      middleware({
        headers: {
          authorization: auth(testCredentials.fred),
          'x-route': 'endpoint=wilma'
        },
        path: '/'
      }, res, next)
      assert(calledNext)
    })
  })
})
