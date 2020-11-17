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
const envelop = require('../../policies/aggregation/envelop')

describe('envelop', () => {
  describe('packageResponses', () => {
    const req = {
      egContext: { requestID: 'test-request-id' },
      url: '/test-url?foo=bar'
    }
    const responses = [[
      { id: 'endpoint-1', name: 'endpoint-1-name', url: 'http://endpoint-1.org' },
      { statusCode: httpcode.OK, body: '{"foo": "bar"}' }
    ], [
      { id: 'endpoint-2', name: 'endpoint-2-name', url: 'http://endpoint-2.org' },
      { statusCode: httpcode.BadRequest, body: '{"foo": "bar"}' }
    ]]

    const resp = envelop.packageResponses(req, responses)

    it('has a gateway property', () => {
      assert.deepEqual(
        resp.gateway,
        {
          requestId: 'test-request-id',
          request: '/test-url?foo=bar',
          endpoints: {
            'endpoint-1': {
              name: 'endpoint-1-name',
              url: 'http://endpoint-1.org/test-url?foo=bar',
              responseCode: httpcode.OK
            },
            'endpoint-2': {
              name: 'endpoint-2-name',
              url: 'http://endpoint-2.org/test-url?foo=bar',
              responseCode: httpcode.BadRequest
            }
          }
        }
      )
    })

    it('has an responses property', () => {
      assert.deepEqual(
        resp.responses,
        { 'endpoint-1': { foo: 'bar' } }
      )
    })
  })
})
