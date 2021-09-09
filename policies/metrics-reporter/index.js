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
  name: 'metrics-reporter',

  schema: {
    $id: 'http://express-gateway.io/schemas/policies/metrics.json',
    type: 'object',
    properties: {
      prefix: {
        type: 'string',
        description: 'prefix to prepend to the metrics names. Default is "gateway_"'
      },
      collectDefaultMetrics: {
        type: 'boolean',
        default: true,
        description: 'if true, collect the `prom-client` default node metrics. Default is true'
      },
      defaultMetricsPrefix: {
        type: 'string',
        default: 'gateway_',
        description: 'Prefix to use for the default metrics (if enabled).'
      },
      defaultMetricsLabels: {
        type: 'object',
        description: 'Additional labels to include for all default metrics'
      },
      labels: {
        type: 'object',
        description: 'Additional labels to include for all metrics'
      },
      url: {
        type: 'string',
        default: '/metrics',
        description: 'Path to serve the metrics report. Default is "/metrics"'
      }
    },
    required: []
  },
  policy: require('./metrics-reporter').policy
}
