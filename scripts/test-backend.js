#!/usr/bin/env node

const basicAuth = require('express-basic-auth')
const fs = require('fs')

const backend = require('../test/backend')

const run = (port) => (
  backend.start(
    'dev/test-backend/data',
    port,
    basicAuth({ users: { fred: 'wilma' } })
  )
)

if (fs.realpathSync(process.argv[1]) === fs.realpathSync(__filename)) {
  console.log('Starting TestBackend..')
  run(8082)
}

module.exports = { run }
