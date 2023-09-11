/* Copyright (C) 2023 SURFnet B.V.
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
const secrets = require('../../lib/secrets.js')
const proxyExtras = require('../../policies/aggregation/proxy-extras.js')

describe('proxy-extras', () => {
  describe('proxyOptionsForEndpoint', () => {
    it('decodes proxyOptionsEncoded', async (data = { auth: 'fred:wilma', headers: {} }) => {
      const proxyOptions = await proxyExtras.proxyOptionsForEndpoint(
        {
          endpoint: {
            proxyOptionsEncoded: await secrets.encode(data)
          }
        }
      )

      assert.deepEqual(proxyOptions, data)
    })

    it('pass through proxyOptions', async (data = { auth: 'fred:wilma', headers: {} }) => {
      const proxyOptions = await proxyExtras.proxyOptionsForEndpoint(
        {
          endpoint: { proxyOptions: data }
        }
      )

      assert.deepEqual(proxyOptions, data)
    })
  })
})
