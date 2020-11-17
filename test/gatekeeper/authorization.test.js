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
const { compileAcls, prepareRequestHeaders, isAuthorized } = require('../../policies/gatekeeper/authorization')
const { MalformedHeader } = require('../../lib/xroute')

describe('gatekeeper/authorization', () => {
  const acls = compileAcls([
    {
      app: 'fred',
      endpoints: [
        {
          endpoint: 'wilma',
          paths: ['/foo', '/foo/:id', '/bar', '/zoo/:id']
        },
        {
          endpoint: 'betty',
          paths: ['/foo']
        }
      ]
    },
    {
      app: 'barney',
      endpoints: [
        {
          endpoint: 'betty',
          paths: ['/foo', '/foo/:id', '/bar']
        }
      ]
    }
  ])

  describe('compileAcls', () => {
    it('maps apps and endpoints to regexps', () => {
      assert.deepEqual(Object.keys(acls), ['fred', 'barney'])
      assert(acls.fred.wilma instanceof RegExp)
      assert(acls.fred.betty instanceof RegExp)
      assert(acls.barney.betty instanceof RegExp)
      assert(!acls.barney.wilma)
    })
  })

  describe('prepareRequestHeaders', () => {
    it('added x-route header when missing', () => {
      const req = { headers: {} }
      prepareRequestHeaders(acls.fred, req)
      assert.equal('endpoint=wilma,betty', req.headers['x-route'])
    })

    it('does nothing when x-route header already exists', () => {
      const req = { headers: { 'x-route': 'Yabba Dabba Doo!' } }
      prepareRequestHeaders(acls.fred, req)
      assert.equal('Yabba Dabba Doo!', req.headers['x-route'])
    })
  })
  describe('isAuthorized', () => {
    it('throws exception with invalid x-route header', () => {
      assert.throws(
        () => {
          isAuthorized(acls.fred, { path: '/foo', headers: { 'x-route': 'dummy' } })
        }, MalformedHeader
      )
    })

    it('throws exception with empty endpoints on x-route header', () => {
      assert.throws(
        () => {
          isAuthorized(acls.fred, { path: '/foo', headers: { 'x-route': 'endpoint=' } })
        }, MalformedHeader
      )
    })

    describe('with x-route header', () => {
      it('returns true when all match', () => {
        assert.equal(
          true,
          isAuthorized(acls.fred, { headers: { 'x-route': 'endpoint=wilma,betty' }, path: '/foo' })
        )
        assert.equal(
          true,
          isAuthorized(acls.fred, { headers: { 'x-route': 'endpoint=wilma' }, path: '/bar' })
        )
        assert.equal(
          true,
          isAuthorized(acls.fred, { headers: { 'x-route': 'endpoint=wilma' }, path: '/foo/1' })
        )
        assert.equal(
          true,
          isAuthorized(acls.fred, { headers: { 'x-route': 'endpoint=wilma' }, path: '/zoo/1' })
        )
        assert.equal(
          true,
          isAuthorized(acls.barney, { headers: { 'x-route': 'endpoint=betty' }, path: '/bar' })
        )
        assert.equal(
          true,
          isAuthorized(acls.barney, { headers: { 'x-route': 'endpoint=betty' }, path: '/foo/1' })
        )
      })

      it('returns false when not supported on all endpoints', () => {
        assert.equal(
          false,
          isAuthorized(acls.fred, { headers: { 'x-route': 'endpoint=wilma,betty,creepella' }, path: '/foo' })
        )
        assert.equal(
          false,
          isAuthorized(acls.fred, { headers: { 'x-route': 'endpoint=wilma,betty' }, path: '/foo/1' })
        )
        assert.equal(
          false,
          isAuthorized(acls.fred, { headers: { 'x-route': 'endpoint=wilma,betty' }, path: '/bar' })
        )
      })

      it('returns false when path does not match', () => {
        assert.equal(
          false,
          isAuthorized(acls.fred, { headers: { 'x-route': 'endpoint=wilma' }, path: '/foo/bar/zoo' })
        )
        assert.equal(
          false,
          isAuthorized(acls.fred, { headers: { 'x-route': 'endpoint=wilma' }, path: '/zoo' })
        )
      })
    })
  })
})
