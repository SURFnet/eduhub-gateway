#!/usr/bin/env node

const basicAuth = require('express-basic-auth')
const fs = require('fs')

const backend = require('../test/backend')

const run = () => (
  backend.start(
    'test-backend/data',
    8082,
    basicAuth({ users: { fred: 'wilma' } })
  )
)

if (fs.realpathSync(process.argv[1]) === fs.realpathSync(__filename)) {
  console.log('Starting TestBackend..')
  run()
}

module.exports = { run }
