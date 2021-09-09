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

const path = require('path')
const gateway = require('express-gateway')

const policies = require('express-gateway/lib/policies')
policies.register(require('./policies/lifecycle-logger'))
policies.register(require('./policies/gatekeeper'))
policies.register(require('./policies/openapi-validator'))
policies.register(require('./policies/aggregation'))
policies.register(require('./policies/metrics-collector'))
policies.register(require('./policies/metrics-reporter'))

gateway()
  .load(path.join(__dirname, 'config'))
  .run()
