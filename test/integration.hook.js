const environment = require('./integration.environment.js');

exports.mochaHooks = {
  async beforeAll() {
    return environment.up();
  },
  async afterAll() {
    return environment.down();
  }
};
