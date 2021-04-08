#!/usr/bin/env node

const express = require('express')
const fs = require('fs')

const httpcode = require('../lib/httpcode')

const app = express()
const tokens = []

app.use(express.urlencoded({ extended: true }))
app.post('/mock/token', (req, res) => {
  if (req.headers['content-type'] &&
      req.headers['content-type'].match(/^application\/x-www-form-urlencoded/) &&
      req.body.grant_type === 'client_credentials' &&
      req.body.client_id === 'fred' &&
      req.body.client_secret === 'wilma') {
    const token = `good-token/${new Date().toISOString()}`

    // keep for inspection in test suite
    tokens.unshift(token)

    res.status(httpcode.OK).json({
      token_type: 'Bearer',
      access_token: token,
      expires_in: 5
    })
  } else {
    res.status(httpcode.BadRequest).json({
      error: 'unauthorized_client'
    })
  }
})

const run = (port) => app.listen(port)

if (fs.realpathSync(process.argv[1]) === fs.realpathSync(__filename)) {
  console.log('Starting MockOAUTH..')
  run(8084)
}

module.exports = { run, tokens }
