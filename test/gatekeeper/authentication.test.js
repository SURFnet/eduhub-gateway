const {v4:uuid} = require('uuid');
const assert = require('assert');

const authentication = require('../../policies/gatekeeper/authentication');

describe('gatekeeper/authentication', () => {
  describe('hashPassword', () => {
    const pass = uuid();
    const otherPass = uuid();
    const salt = uuid();
    const otherSalt = uuid();

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

    const apps = [{
      id: 'fred',
      passwordHash: authentication.hashPassword('wilma', salt = uuid()),
      passwordSalt: salt
    }, {
      id: 'barney',
      passwordHash: authentication.hashPassword('betty', salt = uuid()),
      passwordSalt: salt
    }, {
      id: 'with-colon', // note: it's not possible to have a colon in
                        // the user id with basic authentication
      passwordHash: authentication.hashPassword('with:colon', salt = uuid()),
      passwordSalt: salt
    }];

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

    it('should return nothing with bad from basic authentication credentials', () => {
      assert.equal(
        authentication.appFromRequest({
          headers: {authorization: authorizationHeader('fred', 'betty')}
        }, apps),
        undefined
      );
    });

    it('should return nothing without basic authentication header', () => {
      assert.equal(
        authentication.appFromRequest({headers: {}}, apps),
        undefined
      );
    });

    it('should return nothing with bad basic authentication header', () => {
      assert.equal(
        authentication.appFromRequest({
          headers: {authorization: 'Basic bamm-bamm'}
        }, apps),
        undefined
      );
    });
  });
});
