const assert = require('assert');
const {httpGet, gwContainer, integrationContext} = require('./integration.environment.js');

// As reflected in config/credentials.json.test
const testCredentials = 'test:ea8631510aaa7dd11b734fd9ce167d0a';

integrationContext('example policy', function() {
  it('should respond with 401 without credentials', async () => {
    const port = gwContainer().getMappedPort(8080);
    const res = await httpGet(`http://localhost:${port}/example`);
    assert.equal(res.statusCode, 401);
  });

  it('should respond with 401 with bad credentials', async () => {
    const port = gwContainer().getMappedPort(8080);
    const res = await httpGet(`http://localhost:${port}/example`, {
      auth: 'bad:credentials'
    });
    assert.equal(res.statusCode, 401);
  });

  it('should respond with 400 with auth but without example header', async () => {
    const port = gwContainer().getMappedPort(8080);
    const res = await httpGet(`http://localhost:${port}/example`, {
      auth: testCredentials
    });
    assert.equal(res.statusCode, 400);
  });

  it('should respond with 200 with auth and example header', async () => {
    const port = gwContainer().getMappedPort(8080);
    const res = await httpGet(`http://localhost:${port}/example`, {
      auth: testCredentials,
      headers: {Example: true}
    });
    assert.equal(res.statusCode, 200);
  });
});
