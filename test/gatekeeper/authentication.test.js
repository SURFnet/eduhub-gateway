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
const crypto = require('crypto')

const authentication = require('../../policies/gatekeeper/authentication')

const randomString = () => crypto.randomBytes(16).toString('hex')

describe('gatekeeper/authentication', () => {
  describe('hashPassword', () => {
    const pass = randomString()
    const otherPass = randomString()
    const salt = randomString()
    const otherSalt = randomString()

    assert.strictEqual(
      authentication.hashPassword(pass, salt),
      authentication.hashPassword(pass, salt)
    )
    assert.notStrictEqual(
      authentication.hashPassword(pass, salt),
      authentication.hashPassword(pass, otherSalt)
    )
    assert.notStrictEqual(
      authentication.hashPassword(otherPass, salt),
      authentication.hashPassword(pass, salt)
    )
  })

  describe('appFromRequest', () => {
    let salt
    const apps = {
      fred: {
        passwordHash: authentication.hashPassword('wilma', salt = randomString()),
        passwordSalt: salt
      },
      barney: {
        passwordHash: authentication.hashPassword('betty', salt = randomString()),
        passwordSalt: salt
      },
      'with-colon': { // note: it's not possible to have a colon in the user id with basic authentication
        passwordHash: authentication.hashPassword('with:colon', salt = randomString()),
        passwordSalt: salt
      }
    }

    const authorizationHeader = (user, pass) => (
      `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`
    )

    it('should return app from basic authentication', () => {
      assert.strictEqual(
        authentication.appFromRequest({
          headers: { authorization: authorizationHeader('fred', 'wilma') }
        }, apps),
        'fred'
      )
    })

    it('should allow colon in password', () => {
      assert.strictEqual(
        authentication.appFromRequest({
          headers: { authorization: authorizationHeader('with-colon', 'with:colon') }
        }, apps),
        'with-colon'
      )
    })

    it('should return nothing with bad basic authentication credentials', () => {
      assert.strictEqual(
        authentication.appFromRequest({
          headers: { authorization: authorizationHeader('fred', 'betty') }
        }, apps),
        null
      )
    })

    it('should return nothing without basic authentication header', () => {
      assert.strictEqual(
        authentication.appFromRequest({ headers: {} }, apps),
        null
      )
    })

    it('should return nothing with bad basic authentication header', () => {
      assert.strictEqual(
        authentication.appFromRequest({
          headers: { authorization: 'Basic bamm-bamm' }
        }, apps),
        null
      )
    })
  })
})
