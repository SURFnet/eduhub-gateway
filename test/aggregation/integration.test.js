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

const assert = require('assert').strict
const httpcode = require('../../lib/httpcode')
const mockOauth = require('../../scripts/mock-oauth.js')

const {
  httpGet,
  httpPost,
  integrationContext,
  gatewayUrl,
  sleep,
  TEST_BACKEND_CONTAINER_URL,
  OTHER_TEST_BACKEND_CONTAINER_URL,
  OTHER_TEST_BACKEND_URL,
  MOCK_OAUTH_TOKEN_URL
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
          url: TEST_BACKEND_CONTAINER_URL,
          responseCode: httpcode.OK
        },
        OtherTestBackend: {
          url: OTHER_TEST_BACKEND_CONTAINER_URL,
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

  describe('oauth', () => {
    describe('mock auth setup', () => {
      const params = {
        grant_type: 'client_credentials',
        client_id: 'fred',
        client_secret: 'wilma'
      }
      const postToken = async () => {
        const res = await httpPost(MOCK_OAUTH_TOKEN_URL, { params })
        return JSON.parse(res.body)
      }
      const otherBackendGet = (accessToken) => (
        httpGet(OTHER_TEST_BACKEND_URL, {
          headers: { authorization: `Bearer ${accessToken}` }
        })
      )

      it('returns a bearer token which expires in 5 seconds', async () => {
        const data = await postToken()
        assert.equal(data.token_type, 'Bearer')
        assert.equal(data.expires_in, 5)
        assert.match(data.access_token, /.+/)
      })

      it('can not make unauthorized request to other-test-backend', async () => {
        const res = await httpGet(OTHER_TEST_BACKEND_URL)
        assert.equal(res.statusCode, httpcode.Unauthorized)
      })

      it('can make request to other-test-backend with bearer token', async () => {
        const token = (await postToken()).access_token
        const res = await otherBackendGet(token)
        assert.equal(res.statusCode, httpcode.OK)
      })

      it('can not make request to other-test-backend with expired bearer token', async () => {
        const token = (await postToken()).access_token
        await sleep(5000)
        const res = await otherBackendGet(token)
        assert.equal(res.statusCode, httpcode.Unauthorized)
      })
    })

    describe('caching of tokens', () => {
      it('handles other-test-backend without tripping over expired tokens', async () => {
        const get = async () => httpGet(gatewayUrl('fred', '/'), {
          headers: {
            'X-Route': 'endpoint=OtherTestBackend'
          }
        })
        const tokensIssued = mockOauth.tokens.length

        assert.equal((await get()).statusCode, httpcode.OK)
        assert.equal((await get()).statusCode, httpcode.OK)
        assert.equal((await get()).statusCode, httpcode.OK)

        assert(
          (mockOauth.tokens.length - tokensIssued) <= 1,
          'maximum 1 token issued'
        )

        await sleep(2000)
        assert.equal((await get()).statusCode, httpcode.OK)
        await sleep(2000)
        assert.equal((await get()).statusCode, httpcode.OK)
        await sleep(2000)
        assert.equal((await get()).statusCode, httpcode.OK)

        assert(
          (mockOauth.tokens.length - tokensIssued) >= 2,
          'at least 2 tokens issued due to expiry in 5 seconds'
        )
      })
    })

    describe('bad oauth2 backend configuration', () => {
      it('responds with internal server error for endpoint with bad credentials', async () => {
        let res
        const bad = { headers: { 'X-Route': 'endpoint=BadCredentialsOathTestBackend' } }
        const good = { headers: { 'X-Route': 'endpoint=OtherTestBackend' } }

        res = await httpGet(gatewayUrl('barney', '/'), bad)
        assert.equal(res.statusCode, httpcode.InternalServerError)

        res = await httpGet(gatewayUrl('barney', '/'), good)
        assert.equal(res.statusCode, httpcode.OK)

        res = await httpGet(gatewayUrl('barney', '/'), bad)
        assert.equal(res.statusCode, httpcode.InternalServerError)

        res = await httpGet(gatewayUrl('barney', '/'), good)
        assert.equal(res.statusCode, httpcode.OK)
      })
      it('responds with internal server error for endpoint with unreachable token url', async () => {
        const res = await httpGet(gatewayUrl('barney', '/'), {
          headers: {
            'X-Route': 'endpoint=BadUrlOathTestBackend'
          }
        })
        assert.equal(res.statusCode, httpcode.InternalServerError)
      })
    })
  })
})
