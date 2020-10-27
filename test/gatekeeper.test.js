/* eslint-env mocha */

const assert = require('assert')
const httpcode = require('../lib/httpcode')
const gatekeeper = require('../policies/gatekeeper')
const { testCredentials } = require('./integration.environment.js')

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

    it('returns Unauthorized without basic auth credentials', () => {
      middleware({ headers: {} }, res, next)
      assert(!calledNext)
      assert.strictEqual(gotStatus, httpcode.Unauthorized)
      assert(gotSet['WWW-Authenticate'])
    })

    it('returns Unauthorized without known auth credentials', () => {
      middleware({ headers: { authorization: auth('foo:bar') } }, res, next)
      assert(!calledNext)
      assert.strictEqual(gotStatus, httpcode.Unauthorized)
      assert(gotSet['WWW-Authenticate'])
    })

    it('returns Forbidden with known auth credentials but bad endpoint', () => {
      middleware({
        headers: {
          authorization: auth(testCredentials.fred),
          'x-route': 'endpoint=betty'
        },
        path: '/'
      }, res, next)
      assert(!calledNext)
      assert.strictEqual(gotStatus, httpcode.Forbidden)
    })

    it('returns Forbidden with known auth credentials but bad path', () => {
      middleware({
        headers: {
          authorization: auth(testCredentials.fred),
          'x-route': 'endpoint=wilma'
        },
        path: '/tv'
      }, res, next)
      assert(!calledNext)
      assert.strictEqual(gotStatus, httpcode.Forbidden)
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
