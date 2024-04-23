#!/usr/bin/env node

/* Copyright (C) 2020 SURFnet B.V.
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program. If not, see http://www.gnu.org/licenses/.
 */

const childProcess = require('child_process')
const process = require('process')
const yargs = require('yargs')
const argv = yargs.option({
  rateLimitMax: {
    default: 250,
    type: 'number',
    describe: 'Gateway Rate limit: Max nr of requests to handle in rateLimitWindowMs'
  },
  rateLimitWindowMs: {
    default: 1000,
    type: 'number',
    describe: 'Gateway Rate limit: Rate limit window size in milliseconds'
  },
  rateLimitDelayAfter: {
    default: 0,
    type: 'number',
    describe: 'Gateway Rate limit: Start delaying requests when this number of requests arrive during rateLimitWindowMs. 0 means no delay'
  },
  rateLimitDelayMs: {
    default: 0,
    type: 'number',
    describe: 'Gateway Rate limit: Delay requests by this amount of milliseconds when exceeding rateLimitDelayAfter'
  },
  verbose: {
    default: 1,
    type: 'number',
    describe: 'Apachebench verbosity level. Higher is more verbose'
  }
}).argv

const exec = (command) => {
  console.log(command)
  return new Promise((resolve, reject) => {
    const process = childProcess.exec(command)

    process.stdout.on('data', (data) => {
      console.log(data.toString())
    })

    process.stderr.on('data', (data) => {
      console.error(data.toString())
    })

    process.on('exit', (code) => {
      resolve(code)
    })
  })
}

const {
  up,
  down,
  gatewayUrl,
  testCredentials
} = require('../test/integration.environment.js')

const logException = (e) => {
  console.error('Error in perf test')
  console.trace(e)
}

const performanceTest = async () => {
  process.on('uncaughtException', logException)

  await up(argv)
  console.log('Ready to run')

  const url = gatewayUrl('', '/') // needs plain http url; self-signed certs don't work with apachebench
  console.log(`testing url ${url}`)

  const tests = [1, 10, 25, 50, 100, 250, 500]
  do {
    const concurrency = tests.shift()
    await exec(
      `ab -A ${testCredentials.fred} -v ${argv.verbose} -c ${concurrency} -n 1000 -H "X-Route: endpoint=Test.Backend,Other-Test.Backend" -r -s 300 ${url}`
    ).catch(logException)
  } while (tests.length > 0)
  await down().catch(logException)
}

module.exports = performanceTest()
