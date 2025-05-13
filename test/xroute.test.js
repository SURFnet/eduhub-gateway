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

const assert = require('assert')
const { decode, MalformedHeader } = require('../lib/xroute')

describe('xroute', () => {
  describe('decode', () => {
    it('returns null for missing x-route header', () => {
      assert.deepStrictEqual(decode(undefined), null)
    })

    it('throws error on malformed x-route header when requested', () => {
      assert.throws(() => { decode('dummy', true) }, MalformedHeader)
      assert.throws(() => { decode('endpoint=', true) }, MalformedHeader)
      assert.throws(() => { decode('endpoint=foo;bar', true) }, MalformedHeader)
      assert.throws(() => { decode('endpoint=foo"', true) }, MalformedHeader)
    })

    it('returns null on malformed x-route header', () => {
      assert.equal(null, decode('dummy'))
      assert.equal(null, decode('endpoint='))
      assert.equal(null, decode('endpoint=foo;bar'))
      assert.equal(null, decode('endpoint=foo"'))
    })

    it('returns list of endpoints', () => {
      assert.deepStrictEqual(decode('endpoint=foo,bar'), ['foo', 'bar'])
      assert.deepStrictEqual(decode('endpoint=f.0.o,b-8-r'), ['f.0.o', 'b-8-r'])
      assert.deepStrictEqual(decode('endpoint= foo , bar '), ['foo', 'bar'])
    })

    it('deduplicates list of endpoints', () => {
      assert.deepStrictEqual(decode('endpoint=foo,bar,foo'), ['foo', 'bar'])
    })
  })
})
