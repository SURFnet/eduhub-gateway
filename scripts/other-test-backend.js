#!/usr/bin/env node

const fs = require('fs')
const httpcode = require('../lib/httpcode')

const run = () => (
  require('../test/backend').start(
    'test-backend/data2',
    8083,
    (req, res, next) => {
      if (req.headers.authorization) {
        const token = req.headers.authorization.match(/Bearer (.*)\/(.*)/)
        const [, secret, ts] = token || []
        if (secret === 'good-token' && (new Date() - Date.parse(ts)) < 5000) {
          return next()
        }
      }
      res.set({ 'WWW-Authenticate': 'Bearer' })
      res.sendStatus(httpcode.Unauthorized)
    }
  )
)

if (fs.realpathSync(process.argv[1]) === fs.realpathSync(__filename)) {
  console.log('Starting OtherTestBackend..')
  run()
}

module.exports = { run }
