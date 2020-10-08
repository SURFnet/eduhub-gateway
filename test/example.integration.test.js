const assert = require('assert');
const {httpGet, gwContainer, integrationContext} = require('./integration.environment.js');

integrationContext('example policy', function() {
  it('should respond with 400 without example header', async () => {
    const port = gwContainer().getMappedPort(8080);
    const res = await httpGet(`http://localhost:${port}/example`);
    assert.equal(res.statusCode, 400);
  });

  it('should respond with 200 with example header', async () => {
    const port = gwContainer().getMappedPort(8080);
    const res = await httpGet(`http://localhost:${port}/example`, {headers: {Example: true}});
    assert.equal(res.statusCode, 200);
  });
});

