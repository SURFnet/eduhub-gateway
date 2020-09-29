const path = require('path');
const gateway = require('express-gateway');

const policies = require('express-gateway/lib/policies');
policies.register(require('./policies/example'));

gateway()
  .load(path.join(__dirname, 'config'))
  .run();
