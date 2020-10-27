/* eslint-env mocha */

const assert = require('assert')
const httpcode = require('../lib/httpcode')
const example = require('../policies/example')

describe('example', () => {
  it('has a policy', () => {
    assert(example.policy)
  })

  describe('policy', () => {
    const middleware = example.policy()
    let calledNext, gotStatus
    const res = {
      sendStatus: (v) => { gotStatus = v }
    }
    const next = () => {
      calledNext = true
    }

    it('with example header calls sendStatus(OK)', () => {
      calledNext = gotStatus = undefined
      middleware({ headers: { example: true } }, res, next)
      assert(!calledNext)
      assert.strictEqual(gotStatus, httpcode.OK)
    })

    it('without example header calls sendStatus(BadRequest)', () => {
      calledNext = gotStatus = undefined
      middleware({ headers: {} }, res, next)
      assert(!calledNext)
      assert.strictEqual(gotStatus, httpcode.BadRequest)
    })
  })
})
