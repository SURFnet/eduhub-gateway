/* Copyright (C) 2026 SURFnet B.V.
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

const { ooapiVersionFromRequest } = require('../lib/ooapi')

describe('ooapi', () => {
  describe('ooapiVersionFromRequest', () => {
    it('recognizes wildcard requests', () => {
      assert.equal(
        true, ooapiVersionFromRequest({ headers: { } })
      )
      assert.equal(
        true, ooapiVersionFromRequest({ headers: { accept: null } })
      )
      assert.equal(
        true, ooapiVersionFromRequest({ headers: { accept: '*/*' } })
      )
    })

    it('recognizes v5 requests', () => {
      assert.equal(
        '5', ooapiVersionFromRequest({ headers: { accept: 'application/json' } })
      )
      assert.equal(
        '5', ooapiVersionFromRequest({ headers: { accept: 'application/json;charset=utf-8' } })
      )
    })

    it('recognizes other version requests', () => {
      assert.equal(
        '7', ooapiVersionFromRequest({ headers: { accept: '*/*;version=7' } })
      )
      assert.equal(
        '7', ooapiVersionFromRequest({ headers: { accept: 'application/*;version=7' } })
      )
      assert.equal(
        '7', ooapiVersionFromRequest({ headers: { accept: 'application/vnd.oeapi+json;version=7' } })
      )
    })

    it('drops non matching accept headers', () => {
      assert.equal(
        false, ooapiVersionFromRequest({ headers: { accept: 'dummy' } })
      )
      assert.equal(
        false, ooapiVersionFromRequest({ headers: { accept: '*/json' } }),
        'illegal wildcard'
      )
      assert.equal(
        false, ooapiVersionFromRequest({ headers: { accept: '*/vnd.oeapi+json;version=7' } }),
        'illegal wildcard'
      )
    })
  })
})
