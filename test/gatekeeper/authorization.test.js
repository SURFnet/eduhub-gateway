/* eslint-env mocha */

const assert = require('assert').strict
const { compileAcls, prepareRequestHeaders, isAuthorized } = require('../../policies/gatekeeper/authorization')

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
    it('returns false without valid x-route header', () => {
      assert.equal(
        false,
        isAuthorized(acls.fred, { path: '/foo', headers: { 'x-route': 'dummy' } })
      )
    })

    it('returns false with valid but empty x-route header', () => {
      assert.equal(
        false,
        isAuthorized(acls.fred, { path: '/foo', headers: { 'x-route': 'endpoints=' } })
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
