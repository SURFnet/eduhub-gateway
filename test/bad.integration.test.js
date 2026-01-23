/* Copyright (C) 2021 SURFnet B.V.
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
const httpcode = require('../lib/httpcode')

const {
  httpGet,
  integrationContext,
  gatewayUrl
} = require('./integration.environment.js')

integrationContext('endpoint timeouts', function () {
  describe('bad backend', () => {
    it('backend response status code is BadGateway and body is not present', async () => {
      const res = await httpGet(gatewayUrl('bubbles', '/'), {
        headers: { 'X-Route': 'endpoint=Bad.Backend' }
      })

      const { gateway: { endpoints }, responses } = JSON.parse(res.body)

      assert.equal(
        endpoints['Bad.Backend'].responseCode,
        httpcode.BadGateway
      )
      assert.equal(
        false,
        Object.prototype.hasOwnProperty.call(responses, 'Bad.Backend')
      )
    })
  })

  describe('bad x-routes header', () => {
    it('response status code is BadRequest', async () => {
      const res = await httpGet(gatewayUrl('bubbles', '/'), {
        headers: { 'X-Route': 'endpoint=Bad.Backend*' }
      })

      assert.equal(res.statusCode, httpcode.BadRequest)
      assert.equal('Malformed X-Route header', res.body)
    })
  })

  describe('duplicate x-routes headers', () => {
    it('response status code is BadRequest', async () => {
      const res = await httpGet(gatewayUrl('fred', '/'), {
        headers: {
          'X-Route': [
            'endpoint=Test.Backend',
            'endpoint=Other-Test.Backend',
            'endpoint=Other-Test.Backend',
            'endpoint=Other-Test.Backend',
            'endpoint=Other-Test.Backend',
            'endpoint=Other-Test.Backend',
            'endpoint=Other-Test.Backend',
            'endpoint=Other-Test.Backend',
            'endpoint=Other-Test.Backend',
            'endpoint=Other-Test.Backend',
            'endpoint=Other-Test.Backend',
            'endpoint=Other-Test.Backend',
            'endpoint=Other-Test.Backend',
            'endpoint=Other-Test.Backend'
          ]
        }
      })

      assert.equal(res.statusCode, httpcode.BadRequest)
      assert.equal('Malformed X-Route header', res.body)
    })
  })
})
