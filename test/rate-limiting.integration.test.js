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

const { httpGet, integrationContext, gatewayUrl } = require('./integration.environment.js')

integrationContext('rate limiting', function () {
  it('should be able to get no more than 10 requests/second', async () => {
    const promises = []
    for (let i = 0; i < 20; i++) {
      promises.push(httpGet(gatewayUrl(null, '/courses')))
    }
    const results = await Promise.all(promises)
    assert.ok(results.some((r) => r.statusCode === httpcode.TooManyRequests))
  })
})
