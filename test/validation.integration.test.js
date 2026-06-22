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
  httpPost,
  integrationContext,
  gatewayUrl
} = require('./integration.environment.js')

integrationContext('validation policy', function () {
  it('should respond with OK for a correct request', async () => {
    const res = await httpGet(gatewayUrl('fred', '/courses'))
    assert.equal(res.statusCode, httpcode.OK)
  })

  it('should respond with OK for a correct request for programs v5', async () => {
    const res = await httpGet(gatewayUrl('fred', '/programs'), {
      headers: {
        accept: 'application/json',
        'x-route': 'endpoint=Echo.Backend'
      }
    })
    assert.equal(httpcode.OK, res.statusCode)
  })

  it('should respond with OK for a correct request for programmes v6', async () => {
    const res = await httpGet(gatewayUrl('fred', '/programmes'), {
      headers: {
        accept: 'application/vnd.oeapi+json;version=6',
        'x-route': 'endpoint=Echo.Backend'
      }
    })
    assert.equal(httpcode.OK, res.statusCode)
  })

  it('should respond with OK for a correct request with parameter', async () => {
    const res = await httpGet(gatewayUrl('fred', '/courses?pageNumber=1'))
    assert.equal(res.statusCode, httpcode.OK)
  })

  it('should respond with BadRequest when using wrong method', async () => {
    const res = await httpPost(gatewayUrl('fred', '/courses'), { params: {} })
    assert.equal(res.statusCode, httpcode.BadRequest)

    const { message } = JSON.parse(res.body)
    assert.equal(message, 'Path=/courses with method=post not found from OpenAPI document')
  })

  it('should respond with BadRequest when specifying a parameter with the wrong format', async () => {
    const res = await httpGet(gatewayUrl('fred', '/courses?pageNumber=bar'))
    assert.equal(res.statusCode, httpcode.BadRequest)
    assert.match(res.headers['content-type'], /^application\/json\b/)

    const data = JSON.parse(res.body).data
    assert.equal(data[0].keyword, 'type')
    assert.equal(data[0].instancePath, '/query/pageNumber')
    assert.equal(data[0].params.type, 'integer')
  })

  it('should respond with a full set of errors', async () => {
    const res = await httpGet(gatewayUrl('fred', '/courses?pageNumber=bar&level=bar'))
    assert.equal(res.statusCode, httpcode.BadRequest)
    assert.match(res.headers['content-type'], /^application\/json\b/)

    const data = JSON.parse(res.body).data
    assert.equal(data.length, 2)
    assert.equal(data[0].keyword, 'type')
    assert.equal(data[0].instancePath, '/query/pageNumber')
    assert.equal(data[0].params.type, 'integer')
    assert.equal(data[1].keyword, 'enum')
    assert.equal(data[1].instancePath, '/query/level')
  })

  it('should accept array params in the querystring correctly', async () => {
    const resMultiple = await httpGet(
      gatewayUrl(
        'fred',
        '/courses/900d900d-900d-900d-900d-900d900d900d?expand=programs,coordinators'
      ),
      { headers: { accept: 'application/json' } }
    )
    assert.equal(resMultiple.statusCode, httpcode.OK, resMultiple.body)

    const resSingle = await httpGet(
      gatewayUrl(
        'fred',
        '/courses/900d900d-900d-900d-900d-900d900d900d?expand=programs'
      ),
      { headers: { accept: 'application/json' } }
    )
    assert.equal(resSingle.statusCode, httpcode.OK, resSingle.body)
  })

  describe('with validation', () => {
    it('should respond with OK for a correct response', async () => {
      const res = await httpGet(gatewayUrl(
        'fred',
        '/courses/900d900d-900d-900d-900d-900d900d900d'
      ), {
        headers: {
          'X-Validate-Response': 'true',
          'X-Route': 'endpoint=Test.Backend',
          'Accept-Encoding': 'gzip',
          Accept: 'application/json'
        }
      })
      assert.equal(res.statusCode, httpcode.OK, res.body)
      assert.match(res.headers['content-type'], /^application\/json\b/)

      const course = JSON.parse(res.body)
      assert.equal(course.courseId, '900d900d-900d-900d-900d-900d900d900d')
    })
  })

  describe('without validation', () => {
    it('should respond with OK for a correct response', async () => {
      const res = await httpGet(gatewayUrl('fred', '/courses/900d900d-900d-900d-900d-900d900d900d'))
      assert.equal(res.statusCode, httpcode.OK)
      assert.match(res.headers['content-type'], /^application\/json\b/)

      const course = JSON.parse(res.body).responses['Test.Backend']
      assert.equal(course.courseId, '900d900d-900d-900d-900d-900d900d900d')
    })

    it('should respond with OK for an incorrect response', async () => {
      const res = await httpGet(gatewayUrl('fred', '/courses/badbadba-badb-badb-badb-badbadbadbad'))
      assert.equal(res.statusCode, httpcode.OK)
      assert.match(res.headers['content-type'], /^application\/json\b/)

      const course = JSON.parse(res.body).responses['Test.Backend']
      assert.equal(course.courseId, 'badbadba-badb-badb-badb-badbadbadbad')
    })
  })

  const PATHS = []

  PATHS[6] = [
    '/',
    '/academic-sessions',
    '/academic-sessions/{academicSessionId}',
    '/academic-sessions/{academicSessionId}/course-offerings',
    '/academic-sessions/{academicSessionId}/learning-component-offerings',
    '/academic-sessions/{academicSessionId}/programme-offerings',
    '/academic-sessions/{academicSessionId}/test-component-offerings',
    '/buildings',
    '/buildings/{buildingId}',
    '/buildings/{buildingId}/rooms',
    '/course-offering-associations/external/me',
    '/course-offering-associations/{courseOfferingAssociationId}',
    '/course-offerings/{courseOfferingId}',
    '/course-offerings/{courseOfferingId}/course-offering-associations',
    '/course-offerings/{courseOfferingId}/groups',
    '/course-offerings/{courseOfferingId}/learning-component-offerings',
    '/course-offerings/{courseOfferingId}/test-component-offerings',
    '/courses',
    '/courses/{courseId}',
    '/courses/{courseId}/course-offerings',
    '/courses/{courseId}/learning-component-offerings',
    '/courses/{courseId}/learning-components',
    '/courses/{courseId}/test-component-offerings',
    '/courses/{courseId}/test-components',
    '/documents/{documentId}',
    '/groups',
    '/groups/{groupId}',
    '/groups/{groupId}/memberships',
    '/groups/{groupId}/memberships/{personId}',
    '/learning-component-offering-associations/{learningComponentOfferingAssociationId}',
    '/learning-component-offerings/{learningComponentOfferingId}',
    '/learning-component-offerings/{learningComponentOfferingId}/groups',
    '/learning-component-offerings/{learningComponentOfferingId}/learning-component-offering-associations',
    '/learning-components',
    '/learning-components/{learningComponentId}',
    '/learning-components/{learningComponentId}/learning-component-offerings',
    '/learning-outcomes',
    '/learning-outcomes/{learningOutcomeId}',
    '/organisations',
    '/organisations/{organisationId}',
    '/organisations/{organisationId}/course-offerings',
    '/organisations/{organisationId}/courses',
    '/organisations/{organisationId}/groups',
    '/organisations/{organisationId}/learning-component-offerings',
    '/organisations/{organisationId}/learning-components',
    '/organisations/{organisationId}/programme-offerings',
    '/organisations/{organisationId}/programmes',
    '/organisations/{organisationId}/test-component-offerings',
    '/organisations/{organisationId}/test-components',
    '/persons',
    '/persons/me',
    '/persons/{personId}',
    '/persons/{personId}/course-offering-associations',
    '/persons/{personId}/learning-component-offering-associations',
    '/persons/{personId}/programme-offering-associations',
    '/persons/{personId}/test-component-offering-associations',
    '/programme-offering-associations/external/me',
    '/programme-offering-associations/{programmeOfferingAssociationId}',
    '/programme-offerings/{programmeOfferingId}',
    '/programme-offerings/{programmeOfferingId}/groups',
    '/programme-offerings/{programmeOfferingId}/programme-offering-associations',
    '/programmes',
    '/programmes/{programmeId}',
    '/programmes/{programmeId}/courses',
    '/programmes/{programmeId}/programme-offerings',
    '/programmes/{programmeId}/programmes',
    '/rooms',
    '/rooms/{roomId}',
    '/test-component-offering-associations-attempt/{testComponentOfferingAssociationAttemptId}',
    '/test-component-offering-associations/{testComponentOfferingAssociationId}',
    '/test-component-offering-associations/{testComponentOfferingAssociationId}/test-component-offering-association-attempt/{testComponentOfferingAssociationAttemptId}',
    '/test-component-offering-associations/{testComponentOfferingAssociationId}/test-component-offering-association-attempts',
    '/test-component-offering-associations/{testComponentOfferingAssociationId}/url',
    '/test-component-offerings/{testComponentOfferingId}',
    '/test-component-offerings/{testComponentOfferingId}/groups',
    '/test-component-offerings/{testComponentOfferingId}/test-component-offering-associations',
    '/test-components',
    '/test-components/{testComponentId}',
    '/test-components/{testComponentId}/test-component-offerings']

  PATHS[5] = [
    '/',
    '/academic-sessions',
    '/academic-sessions/{academicSessionId}',
    '/academic-sessions/{academicSessionId}/offerings',
    '/associations/{associationId}',
    '/buildings',
    '/buildings/{buildingId}',
    '/buildings/{buildingId}/rooms',
    '/components/{componentId}',
    '/components/{componentId}/offerings',
    '/courses',
    '/courses/{courseId}',
    '/courses/{courseId}/components',
    '/courses/{courseId}/offerings',
    '/education-specifications',
    '/education-specifications/{educationSpecificationId}',
    '/education-specifications/{educationSpecificationId}/courses',
    '/education-specifications/{educationSpecificationId}/education-specifications',
    '/education-specifications/{educationSpecificationId}/programs',
    '/groups',
    '/groups/{groupId}',
    '/groups/{groupId}/persons',
    '/news-feeds',
    '/news-feeds/{newsFeedId}',
    '/news-feeds/{newsFeedId}/news-items',
    '/news-items/{newsItemId}',
    '/offerings/{offeringId}',
    '/offerings/{offeringId}/associations',
    '/offerings/{offeringId}/groups',
    '/organizations',
    '/organizations/{organizationId}',
    '/organizations/{organizationId}/components',
    '/organizations/{organizationId}/courses',
    '/organizations/{organizationId}/education-specifications',
    '/organizations/{organizationId}/groups',
    '/organizations/{organizationId}/offerings',
    '/organizations/{organizationId}/programs',
    '/persons',
    '/persons/{personId}',
    '/persons/{personId}/associations',
    '/persons/{personId}/groups',
    '/programs',
    '/programs/{programId}',
    '/programs/{programId}/courses',
    '/programs/{programId}/offerings',
    '/programs/{programId}/programs',
    '/rooms',
    '/rooms/{roomId}'
  ]

  describe('smoketest for every v5 path', () => {
    (PATHS[5]).forEach((path) => {
      const p = path.replace(/{.*}/, '900d900d-900d-900d-900d-900d900d900d')
      it(`Path '${p}' should give an OK response`, async () => {
        const { statusCode, body } = await httpGet(gatewayUrl('fred', p), {
          headers: {
            Accept: 'application/json',
            'X-Route': 'endpoint=Test.Backend'
          }
        })
        const summary =
              statusCode === httpcode.OK ? { statusCode } : { statusCode, body }
        assert.deepEqual(summary, { statusCode: httpcode.OK })
      })
    })
  })

  describe('smoketest for every v6 path', () => {
    (PATHS[6]).forEach((path) => {
      const p = path.replace(/{.*}/, '900d900d-900d-900d-900d-900d900d900d')
      it(`Path '${p}' should give an OK response`, async () => {
        const { statusCode, body } = await httpGet(gatewayUrl('fred', p), {
          headers: {
            Accept: 'application/vnd.oeapi+json;version=6.0',
            'X-Route': 'endpoint=Test.Backend'
          }
        })
        const summary =
              statusCode === httpcode.OK ? { statusCode } : { statusCode, body }
        assert.deepEqual(summary, { statusCode: httpcode.OK })
      })
    })
  })
})
