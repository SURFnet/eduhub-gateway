const path = require('path')
const gateway = require('express-gateway')

const policies = require('express-gateway/lib/policies')
policies.register(require('./policies/gatekeeper'))
policies.register(require('./policies/openapi-validator'))
policies.register(require('./policies/aggregation'))

gateway()
  .load(path.join(__dirname, 'config'))
  .run()
