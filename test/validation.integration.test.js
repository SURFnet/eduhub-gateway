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

integrationContext('validation policy', function () {
  it('should respond with OK for a correct request', async () => {
    const res = await httpGet(gatewayUrl('fred', '/courses'))
    assert.equal(res.statusCode, httpcode.OK)
  })

  it('should respond with OK for a correct request with parameter', async () => {
    const res = await httpGet(gatewayUrl('fred', '/courses?pageNumber=1'))
    assert.equal(res.statusCode, httpcode.OK)
  })

  it('should respond with BadRequest when specifying a parameter with the wrong format', async () => {
    const res = await httpGet(gatewayUrl('fred', '/courses?pageNumber=bar'))
    assert.equal(res.statusCode, httpcode.BadRequest)
    assert.match(res.headers['content-type'], /^application\/json\b/)

    const data = JSON.parse(res.body).data
    assert.equal(data[0].keyword, 'type')
    assert.equal(data[0].dataPath, '.query.pageNumber')
    assert.equal(data[0].params.type, 'integer')
  })

  it('should accept array params in the querystring correctly', async () => {
    const resMultiple = await httpGet(gatewayUrl('fred', '/courses/900d900d-900d-900d-900d-900d900d900d?expand=programs&expand=coordinator'))
    assert.equal(resMultiple.statusCode, httpcode.OK, resMultiple.body)

    const resSingle = await httpGet(gatewayUrl('fred', '/courses/900d900d-900d-900d-900d-900d900d900d?expand=programs'))
    assert.equal(resSingle.statusCode, httpcode.OK, resSingle.body)
  })

  describe('with validation', () => {
    it('should respond with OK for a correct response', async () => {
      const res = await httpGet(gatewayUrl('fred', '/courses/900d900d-900d-900d-900d-900d900d900d'), {
        headers: {
          'X-Validate-Response': 'true',
          'X-Route': 'endpoint=TestBackend',
          'Accept-Encoding': 'gzip'
        }
      })
      assert.equal(res.statusCode, httpcode.OK)
      assert.match(res.headers['content-type'], /^application\/json\b/)

      const course = JSON.parse(res.body)
      assert.equal(course.courseId, '900d900d-900d-900d-900d-900d900d900d')
    })

    it('should respond with BadGateway for an incorrect response', async () => {
      const res = await httpGet(gatewayUrl('fred', '/courses/badbadba-badb-badb-badb-badbadbadbad'), {
        headers: {
          'X-Validate-Response': 'true',
          'X-Route': 'endpoint=TestBackend',
          'Accept-Encoding': 'gzip'
        }
      })
      assert.equal(res.statusCode, httpcode.BadGateway)
      assert.match(res.headers['content-type'], /^application\/json\b/)

      const data = JSON.parse(res.body).data
      assert.equal(data[0].keyword, 'required')
      assert.equal(data[0].params.missingProperty, 'name')
    })
  })

  describe('without validation', () => {
    it('should respond with OK for a correct response', async () => {
      const res = await httpGet(gatewayUrl('fred', '/courses/900d900d-900d-900d-900d-900d900d900d'))
      assert.equal(res.statusCode, httpcode.OK)
      assert.match(res.headers['content-type'], /^application\/json\b/)

      const course = JSON.parse(res.body).responses.TestBackend
      assert.equal(course.courseId, '900d900d-900d-900d-900d-900d900d900d')
    })

    it('should respond with OK for an incorrect response', async () => {
      const res = await httpGet(gatewayUrl('fred', '/courses/badbadba-badb-badb-badb-badbadbadbad'))
      assert.equal(res.statusCode, httpcode.OK)
      assert.match(res.headers['content-type'], /^application\/json\b/)

      const course = JSON.parse(res.body).responses.TestBackend
      assert.equal(course.courseId, 'badbadba-badb-badb-badb-badbadbadbad')
    })
  })
})
