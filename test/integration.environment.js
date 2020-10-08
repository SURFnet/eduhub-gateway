const http = require('http');
const path = require('path');
const {DockerComposeEnvironment, Wait} = require('testcontainers');

let environment;
let gwContainer;
const skipTest = process.env.MOCHA_SKIP == 'integration';

module.exports = {
  up: async () => {
    if (skipTest) return;

    const composeFilePath = path.resolve(__dirname, "..");
    const composeFile = "docker-compose.test.yml";

    process.env.OOAPI_MOCK_URL='http://ooapi-mock:8080/';

    environment = await new DockerComposeEnvironment(composeFilePath, composeFile).
      withWaitStrategy("surf-ooapi-gateway_ooapi-mock_1", Wait.forLogMessage("port:")).up();
    gwContainer = environment.getContainer("surf-ooapi-gateway_gw-test_1");
  },
  down: async () => {
    if (skipTest) return;
    await environment.down();
  },
  gwContainer: () => {
    if (!gwContainer) {
      throw new Error("Integration environment not initialized!");
    }
    return gwContainer;
  },
  integrationContext: (description, callback) => {
    if (skipTest) {
      describe.skip(description, callback);
    }
    else {
      describe(description,callback);
    }
  },
  skipTest: skipTest,
  httpGet: (url, opts) => {
    return new Promise(
      (resolve, reject) => http.get(url, opts, res => resolve(res))
    );
  }
};

