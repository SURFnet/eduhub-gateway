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
      apps: {
        fred: {
          passwordSalt: '8b52795e90b598eb022647f17c93ac2b',
          passwordHash: 'e4c9628c52aead0dcf10330a6864d8bcc78a5a4a463b274bee39cee4cfc0a574'
        },
        barney: {
          passwordSalt: '5e5b3fb149fdd06ba9d18edd178d77cb',
          passwordHash: '19d767b82ebb294e3c2008b53a0bcc59140e688baded13eea1794099c869e89f'
        },
        bubbles: {
          passwordSalt: '5970ad7d7501916274cf114f68d2aed0',
          passwordHash: '5e063ba6dcff4b7bc0234be7861dac8c4dd7db573f36755e0578b2e77a5cf6bf'
        }
      },
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
    const res = {
      set: (v) => { gotSet = v },
      sendStatus: (v) => { gotStatus = v },
      status: (v) => { gotStatus = v; return res },
      send: () => {}
    }
    const next = () => { calledNext = true }
    const auth = (cred) => `Basic ${Buffer.from(cred, 'utf-8').toString('base64')}`

    beforeEach(() => {
      calledNext = gotStatus = gotSet = undefined
    })

    it('returns Unauthorized without basic auth credentials', () => {
      middleware({
        headers: {},
        egContext: {}
      }, res, next)
      assert(!calledNext)
      assert.strictEqual(gotStatus, httpcode.Unauthorized)
      assert(gotSet['WWW-Authenticate'])
    })

    it('returns Unauthorized without known auth credentials', () => {
      middleware({
        headers: { authorization: auth('foo:bar') },
        egContext: {}
      }, res, next)
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
        path: '/',
        egContext: {}
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
        path: '/tv',
        egContext: {}
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
        path: '/',
        egContext: {}
      }, res, next)
      assert(calledNext)
    })

    it('returns BadRequest with bad malformed x-route header', () => {
      middleware({
        headers: {
          authorization: auth(testCredentials.fred),
          'x-route': 'endpoints=wilma' // it should "endpoint" without "s"
        },
        path: '/',
        egContext: {}
      }, res, next)
      assert(!calledNext)
      assert.strictEqual(gotStatus, httpcode.BadRequest)
    })
  })
})
