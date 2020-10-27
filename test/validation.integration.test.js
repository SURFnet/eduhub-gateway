/* eslint-env mocha */

const assert = require('assert').strict
const httpcode = require('../lib/httpcode')

const { httpGet, gwContainer, integrationContext } = require('./integration.environment.js')

integrationContext('validation policy', function () {
  it('should respond with OK for a correct request', async () => {
    const port = gwContainer().getMappedPort(8080)

    const res = await httpGet(`http://localhost:${port}/courses`)
    assert.equal(res.statusCode, httpcode.OK)
  })

  it('should respond with OK for a correct request with parameter', async () => {
    const port = gwContainer().getMappedPort(8080)

    const res = await httpGet(`http://localhost:${port}/courses?pageNumber=1`)
    assert.equal(res.statusCode, httpcode.OK)
  })

  it('should respond with BadRequest when specifying a parameter with the wrong format', async () => {
    const port = gwContainer().getMappedPort(8080)

    const res = await httpGet(`http://localhost:${port}/courses?pageNumber=bar`)
    assert.equal(res.statusCode, httpcode.BadRequest)
    assert.match(res.headers['content-type'], /^application\/json\b/)

    const data = JSON.parse(res.body).data
    assert.equal(data[0].keyword, 'type')
    assert.equal(data[0].dataPath, '.query.pageNumber')
    assert.equal(data[0].params.type, 'integer')
  })

  describe('with validation', () => {
    it('should respond with OK for a correct response', async () => {
      const port = gwContainer().getMappedPort(8080)

      const res = await httpGet(`http://localhost:${port}/courses/900d900d-900d-900d-900d-900d900d900d`, {
        headers: {
          'X-Validate-Response': 'true',
          'Accept-Encoding': 'gzip'
        }
      })
      assert.equal(res.statusCode, httpcode.OK)
      assert.match(res.headers['content-type'], /^application\/json\b/)

      const course = JSON.parse(res.body)
      assert.equal(course.courseId, '900d900d-900d-900d-900d-900d900d900d')
    })

    it('should respond with BadGateway for an incorrect response', async () => {
      const port = gwContainer().getMappedPort(8080)

      const res = await httpGet(`http://localhost:${port}/courses/badbadba-badb-badb-badb-badbadbadbad`, {
        headers: {
          'X-Validate-Response': 'true',
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
      const port = gwContainer().getMappedPort(8080)

      const res = await httpGet(`http://localhost:${port}/courses/900d900d-900d-900d-900d-900d900d900d`)
      assert.equal(res.statusCode, httpcode.OK)
      assert.match(res.headers['content-type'], /^application\/json\b/)

      const course = JSON.parse(res.body)
      assert.equal(course.courseId, '900d900d-900d-900d-900d-900d900d900d')
    })

    it('should respond with OK for an incorrect response', async () => {
      const port = gwContainer().getMappedPort(8080)

      const res = await httpGet(`http://localhost:${port}/courses/badbadba-badb-badb-badb-badbadbadbad`)
      assert.equal(res.statusCode, httpcode.OK)
      assert.equal(res.headers['content-type'], 'application/json')

      const course = JSON.parse(res.body)
      assert.equal(course.courseId, 'badbadba-badb-badb-badb-badbadbadbad')
    })
  })
})
