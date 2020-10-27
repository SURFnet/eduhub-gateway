/* eslint-env mocha */

const assert = require('assert')
const { compileAcls, isAuthorized } = require('../../policies/gatekeeper/authorization')

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
      assert.deepStrictEqual(Object.keys(acls), ['fred', 'barney'])
      assert(acls.fred.wilma instanceof RegExp)
      assert(acls.fred.betty instanceof RegExp)
      assert(acls.barney.betty instanceof RegExp)
      assert(!acls.barney.wilma)
    })
  })

  describe('isAuthorized', () => {
    it('returns false without valid x-route header', () => {
      assert.strictEqual(
        false,
        isAuthorized('fred', acls, { path: '/foo', headers: { 'x-route': 'dummy' } })
      )
    })

    it('returns false with valid but empty x-route header', () => {
      assert.strictEqual(
        false,
        isAuthorized('fred', acls, { path: '/foo', headers: { 'x-route': 'endpoints=' } })
      )
    })

    describe('without x-route header', () => {
      it('return true when path matches all available endpoints', () => {
        assert.strictEqual(
          true,
          isAuthorized('fred', acls, { path: '/foo', headers: {} })
        )
      })

      it('return false when path does not match all available endpoints', () => {
        assert.strictEqual(
          false,
          isAuthorized('fred', acls, { path: '/bar', headers: {} })
        )
      })
    })

    describe('with x-route header', () => {
      it('returns true when all match', () => {
        assert.strictEqual(
          true,
          isAuthorized('fred', acls, { headers: { 'x-route': 'endpoint=wilma,betty' }, path: '/foo' })
        )
        assert.strictEqual(
          true,
          isAuthorized('fred', acls, { headers: { 'x-route': 'endpoint=wilma' }, path: '/bar' })
        )
        assert.strictEqual(
          true,
          isAuthorized('fred', acls, { headers: { 'x-route': 'endpoint=wilma' }, path: '/foo/1' })
        )
        assert.strictEqual(
          true,
          isAuthorized('fred', acls, { headers: { 'x-route': 'endpoint=wilma' }, path: '/zoo/1' })
        )
        assert.strictEqual(
          true,
          isAuthorized('barney', acls, { headers: { 'x-route': 'endpoint=betty' }, path: '/bar' })
        )
        assert.strictEqual(
          true,
          isAuthorized('barney', acls, { headers: { 'x-route': 'endpoint=betty' }, path: '/foo/1' })
        )
      })

      it('returns false when not supported on all endpoints', () => {
        assert.strictEqual(
          false,
          isAuthorized('fred', acls, { headers: { 'x-route': 'endpoint=wilma,betty,creepella' }, path: '/foo' })
        )
        assert.strictEqual(
          false,
          isAuthorized('fred', acls, { headers: { 'x-route': 'endpoint=wilma,betty' }, path: '/foo/1' })
        )
        assert.strictEqual(
          false,
          isAuthorized('fred', acls, { headers: { 'x-route': 'endpoint=wilma,betty' }, path: '/bar' })
        )
      })

      it('returns false when path does not match', () => {
        assert.strictEqual(
          false,
          isAuthorized('fred', acls, { headers: { 'x-route': 'endpoint=wilma' }, path: '/foo/bar/zoo' })
        )
        assert.strictEqual(
          false,
          isAuthorized('fred', acls, { headers: { 'x-route': 'endpoint=wilma' }, path: '/zoo' })
        )
      })
    })
  })
})
