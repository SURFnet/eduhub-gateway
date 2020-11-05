/* eslint-env mocha */

const assert = require('assert')
const { decode, MalformedHeader } = require('../lib/xroute')

describe('xroute', () => {
  describe('decode', () => {
    it('returns null for missing x-route header', () => {
      assert.deepStrictEqual(decode(undefined), null)
    })

    it('throws error on malformed x-route header', () => {
      assert.throws(() => { decode('dummy') }, MalformedHeader)
      assert.throws(() => { decode('endpoint=') }, MalformedHeader)
      assert.throws(() => { decode('endpoint=foo;bar') }, MalformedHeader)
    })

    it('returns list of endpoints', () => {
      assert.deepStrictEqual(decode('endpoint=foo,bar'), ['foo', 'bar'])
      assert.deepStrictEqual(decode('endpoint= foo , bar '), ['foo', 'bar'])
    })

    it('deduplicates list of endpoints', () => {
      assert.deepStrictEqual(decode('endpoint=foo,bar,foo'), ['foo', 'bar'])
    })
  })
})
