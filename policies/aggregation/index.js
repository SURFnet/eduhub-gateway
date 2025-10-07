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

module.exports = {
  name: 'aggregation',

  schema: {
    $id: 'http://express-gateway.io/schemas/policies/surfnet-ooapi-gw-aggregation.json',
    type: 'object',
    properties: {
      noEnvelopIfAnyHeaders: {
        type: 'object'
      },
      keepRequestHeaders: {
        type: 'array',
        items: { type: 'string' }
      },
      keepResponseHeaders: {
        type: 'array',
        items: { type: 'string' }
      },
      metricsPrefix: {
        type: 'string',
        description: 'Prefix for metrics for outgoing HTTP requests'
      }

    },
    required: []
  },

  policy: require('./aggregation.js')
}
