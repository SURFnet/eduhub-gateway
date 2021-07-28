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
const httpcode = require('../lib/httpcode')

const {
  httpGet,
  integrationContext,
  gatewayUrl
} = require('./integration.environment.js')

integrationContext('security headers', function () {
  it('should set required SURF headers', async () => {
    const res = await httpGet(gatewayUrl('fred', '/courses'))
    const testHeaders = {
      'x-xss-protection': '1; mode-block',
      'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
      'x-frame-options': 'SAMEORIGIN',
      'x-content-type-options': 'nosniff',
      'content-security-policy': 'default-src \'self\'',
      'access-control-allow-origin': '*.surf.nl',
      'referrer-policy': 'no-referrer-when-downgrade'
    }
    Object.entries(testHeaders).forEach(([header, v]) => {
      assert.equal(res.headers[header], v)
    })
  })

  describe('echo backend', () => {
    it('responds with the request headers in the response body', async () => {
      const res = await httpGet(gatewayUrl('bubbles', '/'), {
        headers: {
          'X-Route': 'endpoint=Echo.Backend',
          'Accept-Language': 'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5'
        }
      })
      assert.equal(res.statusCode, httpcode.OK)
      assert.equal(JSON.parse(res.body).responses['Echo.Backend']['accept-language'], 'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5')
    })
  })
})
