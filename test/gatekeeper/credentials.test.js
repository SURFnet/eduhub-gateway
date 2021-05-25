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

/* eslint-env mocha */

const assert = require('assert').strict
const fs = require('fs')
const os = require('os')
const path = require('path')

const credentials = require('../../policies/gatekeeper/credentials')

const testData = fs.readFileSync('config/credentials.json.test')

describe('gatekeeper/credentials', () => {
  let tmpdir, credentialsFile
  beforeEach(() => {
    tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'ooapi-gw-test-'))
    credentialsFile = path.join(tmpdir, 'credentials.json')
    fs.writeFileSync(credentialsFile, testData, { mode: 0o600 })
  })
  afterEach(() => {
    fs.rmSync(tmpdir, { recursive: true, force: true })
  })

  it('reads from the credentials file', () => {
    const cred = credentials.read(credentialsFile)
    assert(cred.fred && cred.barney && cred.bubbles, 'all present')
  })

  it('reads new version of the credentials file when changed', async () => {
    credentials.watch(credentialsFile)

    // overwrite file with new data
    fs.writeFileSync(credentialsFile, '{"betty": {}}', { mode: 0o600 })

    // give watcher some time to react
    await new Promise(resolve => setTimeout(resolve, 500))

    const cred = credentials.read(credentialsFile)
    assert(cred.betty && !cred.fred && !cred.barney && !cred.bubbles, 'only Betty')
  })
})
