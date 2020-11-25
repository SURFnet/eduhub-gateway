#!/usr/bin/env node

const httpcode = require('../lib/httpcode')

module.exports = require('../test/backend').start(
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
