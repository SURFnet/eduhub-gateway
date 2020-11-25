#!/usr/bin/env node

const basicAuth = require('express-basic-auth')
const backend = require('../test/backend')
module.exports = backend.start(
  'test-backend/data',
  8082,
  basicAuth({ users: { fred: 'wilma' } })
)
