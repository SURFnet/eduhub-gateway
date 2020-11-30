#!/usr/bin/env node

const express = require('express')
const httpcode = require('../lib/httpcode')

const app = express()

app.use(express.urlencoded({ extended: true }))
app.post('/mock/token', (req, res) => {
  if (req.headers['content-type'] &&
      req.headers['content-type'].match(/^application\/x-www-form-urlencoded/) &&
      req.body.grant_type === 'client_credentials' &&
      req.body.client_id === 'fred' &&
      req.body.client_secret === 'wilma') {
    res.status(httpcode.OK).json({
      token_type: 'Bearer',
      access_token: `good-token/${new Date().toISOString()}`,
      expires_in: 5
    })
  } else {
    res.status(httpcode.BadRequest).json({
      error: 'unauthorized_client'
    })
  }
})

module.exports = app.listen(8084)
