#!/usr/bin/env node

const fs = require('fs')
const express = require('express')

const run = (port) => {
  const app = express()
  app.get('/', function (request, response) {
    response.send(request.headers)
  })
  return app.listen(port)
}

if (fs.realpathSync(process.argv[1]) === fs.realpathSync(__filename)) {
  console.log('Starting EchoBackend..')
  run(8085)
}

module.exports = { run }
