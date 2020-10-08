const assert = require('assert');
const crypto = require('crypto');

const authentication = require('../../policies/gatekeeper/authentication');

const randomString = () => crypto.randomBytes(16).toString('hex');

describe('gatekeeper/authentication', () => {
  describe('hashPassword', () => {
    const pass = randomString();
    const otherPass = randomString();
    const salt = randomString();
    const otherSalt = randomString();

    assert.equal(
      authentication.hashPassword(pass, salt),
      authentication.hashPassword(pass, salt)
    );
    assert.notEqual(
      authentication.hashPassword(pass, salt),
      authentication.hashPassword(pass, otherSalt)
    );
    assert.notEqual(
      authentication.hashPassword(otherPass, salt),
      authentication.hashPassword(pass, salt)
    );
  });

  describe('appFromRequest', () => {
    let salt;

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
    };

    const authorizationHeader = (user, pass) => (
      `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`
    )

    it('should return app from basic authentication', () => {
      assert.equal(
        authentication.appFromRequest({
          headers: {authorization: authorizationHeader('fred', 'wilma')}
        }, apps),
        'fred'
      );
    });

    it('should allow colon in password', () => {
      assert.equal(
        authentication.appFromRequest({
          headers: {authorization: authorizationHeader('with-colon', 'with:colon')}
        }, apps),
        'with-colon'
      );
    });

    it('should return nothing with bad basic authentication credentials', () => {
      assert.equal(
        authentication.appFromRequest({
          headers: {authorization: authorizationHeader('fred', 'betty')}
        }, apps),
        null
      );
    });

    it('should return nothing without basic authentication header', () => {
      assert.equal(
        authentication.appFromRequest({headers: {}}, apps),
        null
      );
    });

    it('should return nothing with bad basic authentication header', () => {
      assert.equal(
        authentication.appFromRequest({
          headers: {authorization: 'Basic bamm-bamm'}
        }, apps),
        null
      );
    });
  });
});
