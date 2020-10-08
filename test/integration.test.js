const http = require('http');
const assert = require('assert');
const path = require('path');
const {DockerComposeEnvironment, Wait} = require('testcontainers');

const httpGet = (url, opts) => {
  return new Promise(
    (resolve, reject) => http.get(url, opts, res => resolve(res))
  );
}

const skipThisTest = process.env.MOCKA_SKIP == 'integration';

describe('in integration environment', () => {
  let environment;
  let gwContainer;

  before(async function() {
    if (skipThisTest) {
      this.skip();
    } else {
      const composeFilePath = path.resolve(__dirname, "..");
      const composeFile = "docker-compose.test.yml";

      process.env.OOAPI_MOCK_URL='http://ooapi-mock:8080/';

      environment = await new DockerComposeEnvironment(composeFilePath, composeFile).
        withWaitStrategy("surf-ooapi-gateway_ooapi-mock_1",Wait.forLogMessage("port:")).up();

      gwContainer = environment.getContainer("surf-ooapi-gateway_gw-test_1");
    }
  });

  after(async () => {
    if (!skipThisTest) {
      await environment.down();
    }
  });

  describe('validation policy', function() {

    it('should respond with 200 for a correct request', async () => {
      const port = gwContainer.getMappedPort(8080);
      const res = await httpGet(`http://localhost:${port}/courses`);
      assert.equal(res.statusCode, 200);
    });

    it('should respond with 400 when specifying an unknown parameter', async () => {
      const port = gwContainer.getMappedPort(8080);
      const res = await httpGet(`http://localhost:${port}/courses?foo=bar`);
      assert.equal(res.statusCode, 400);
    });

  });

  describe('example policy', function() {

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
});
