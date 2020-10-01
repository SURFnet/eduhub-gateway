const path = require('path');
const gateway = require('express-gateway');

const policies = require('express-gateway/lib/policies');
policies.register(require('./policies/example'));
policies.register(require('./policies/gatekeeper'));
policies.register(require('./policies/openapi-validator'));

gateway()
  .load(path.join(__dirname, 'config'))
  .run();
