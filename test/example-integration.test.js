const http = require('http');
const assert = require('assert');
const path = require('path');
const {DockerComposeEnvironment} = require('testcontainers');

const httpGet = (url, opts) => {
  return new Promise(
    (resolve, reject) => http.get(url, opts, res => resolve(res))
  );
}

const skipThisTest = process.env.MOCKA_SKIP == 'integration';

describe('example integration with container', () => {
  let environment;
  let gwContainer;

  before(async function() {
    if (skipThisTest) {
      this.skip();
    } else {
      const composeFilePath = path.resolve(__dirname, "..");
      const composeFile = "docker-compose.test.yml";

      environment = await new DockerComposeEnvironment(composeFilePath, composeFile).up();
      gwContainer = environment.getContainer("surf-ooapi-gateway_gw-test_1");
    }
  })

  after(async () => {
    if (!skipThisTest) {
      await environment.down();
    }
  });

  it('should respond with 400 without example header', async () => {
    const port = gwContainer.getMappedPort(8080);
    const res = await httpGet(`http://localhost:${port}/example`);
    assert.equal(res.statusCode, 400);
  });

  it('should respond with 200 with example header', async () => {
    const port = gwContainer.getMappedPort(8080);
    const res = await httpGet(`http://localhost:${port}/example`, {headers: {Example: true}});
    assert.equal(res.statusCode, 200);
  });
});
