#!/usr/bin/env node

const backend = require('../test/backend')
module.exports = backend.start('test-backend/data2', 8083)
