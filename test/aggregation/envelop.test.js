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
      { id: 'endpoint', name: 'endpoint-name', url: 'http://endpoint.org' },
      {
        statusCode: httpcode.OK,
        body: '{"foo": "bar"}',
        headers: { 'content-type': 'application/json' }
      }
    ], [
      { id: 'bad-request-endpoint', name: 'bad-request-endpoint-name', url: 'http://bad-request-endpoint.org/test/' },
      {
        statusCode: httpcode.BadRequest,
        body: '{"foo": "bar"}',
        headers: { 'content-type': 'application/json' }
      }
    ], [
      { id: 'bad-content-endpoint', name: 'bad-content-endpoint-name', url: 'http://bad-content-endpoint.org' },
      {
        statusCode: httpcode.OK,
        body: 'bad',
        headers: { 'content-type': 'application/json' }
      }
    ]]

    const resp = envelop.packageResponses(req, responses)

    it('has a gateway property', () => {
      assert.deepEqual(
        resp.gateway,
        {
          requestId: 'test-request-id',
          request: '/test-url?foo=bar',
          endpoints: {
            endpoint: {
              name: 'endpoint-name',
              url: 'http://endpoint.org/test-url?foo=bar',
              responseCode: httpcode.OK,
              headers: { 'content-type': 'application/json' }
            },
            'bad-request-endpoint': {
              name: 'bad-request-endpoint-name',
              url: 'http://bad-request-endpoint.org/test/test-url?foo=bar',
              responseCode: httpcode.BadRequest,
              headers: { 'content-type': 'application/json' }
            },
            'bad-content-endpoint': {
              name: 'bad-content-endpoint-name',
              url: 'http://bad-content-endpoint.org/test-url?foo=bar',
              responseCode: httpcode.OK,
              headers: { 'content-type': 'application/json' }
            }
          }
        }
      )
    })

    it('has an responses property', () => {
      assert.deepEqual(
        resp.responses, {
          endpoint: { foo: 'bar' },
          'bad-content-endpoint': null
        }
      )
    })
  })
})
