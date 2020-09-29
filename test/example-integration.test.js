const axios = require('axios');
const assert = require('assert');
const path = require('path');
const {DockerComposeEnvironment} = require('testcontainers');

const httpGet = async (url, headers = {}) => {
  let res;
  try { res = await axios.get(url, headers); } catch (err) { res = err.response; }
  return res;
}

describe('example integration with container', () => {
  let environment;
  let gwContainer;

  before(async () => {
    const composeFilePath = path.resolve(__dirname, "..");
    const composeFile = "docker-compose.test.yml";

    environment = await new DockerComposeEnvironment(composeFilePath, composeFile).up();
    gwContainer = environment.getContainer("surf-ooapi-gateway_gw-test_1");
  })

  after(async () => {
    await environment.down();
  });

  it('should respond with 400 without example header', async () => {
    const port = gwContainer.getMappedPort(8080);
    const res = await httpGet(`http://localhost:${port}/example`);
    assert(res.status === 400, `expected status 400 but got ${res.status}`);
  });

  it('should respond with 200 with example header', async () => {
    const port = gwContainer.getMappedPort(8080);
    const res = await httpGet(`http://localhost:${port}/example`, {headers: {Example: true}});
    assert(res.status === 200, `expected status 200 but got ${res.status}`);
  });
});
