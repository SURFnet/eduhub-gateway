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
  describe('slow backend', () => {
    it('backend response status code is 0 when sleeping longer than configured 500ms', async () => {
      const res = await httpGet(gatewayUrl('bubbles', `/?sleep=${1000 * 60 * 60 * 24}`), {
        headers: { 'X-Route': 'endpoint=Slow.Backend' }
      })
      const { gateway: { endpoints } } = JSON.parse(res.body)
      assert.equal(
        endpoints['Slow.Backend'].responseCode,
        0
      )
    })

    it('backend response status code is OK when fast enough', async () => {
      const res = await httpGet(gatewayUrl('bubbles', '/?sleep=0'), {
        headers: { 'X-Route': 'endpoint=Slow.Backend' }
      })
      const { gateway: { endpoints } } = JSON.parse(res.body)
      assert.equal(
        endpoints['Slow.Backend'].responseCode,
        httpcode.OK
      )
    })
  })
})
