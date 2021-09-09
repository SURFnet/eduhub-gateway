/* Copyright (C) 2021 SURFnet B.V.
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
  name: 'metrics-collector',

  schema: {
    $id: 'http://express-gateway.io/schemas/policies/metrics.json',
    type: 'object',
    required: [],
    properties: {
      labels: {
        type: 'object',
        description: 'Additional labels to include for incoming request metrics'
      },
      prefix: {
        type: 'string',
        description: 'Prefix for incoming request metrics. Default is "gateway_"'
      }
    }
  },

  policy: require('./metrics-collector').policy
}
