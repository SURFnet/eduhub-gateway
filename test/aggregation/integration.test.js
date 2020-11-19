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
          url: 'http://host.testcontainers.internal:8082/',
          responseCode: httpcode.OK
        },
        OtherTestBackend: {
          url: 'http://host.testcontainers.internal:8083/ooapi/',
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
