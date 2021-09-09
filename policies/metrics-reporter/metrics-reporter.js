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

const prom = require('prom-client')

module.exports = {
  policy: ({
    url = '/metrics',
    collectDefaultMetrics = true,
    defaultMetricsPrefix = 'gateway_',
    defaultMetricsLabels = null,
    labels = null
  }) => {
    // When metrics are reconfigured, the gateway needs to be restarted.
    //
    // If the gateway is not restarted the old metrics are kept and not
    // reconfigured
    if (!prom.register.getSingleMetric(defaultMetricsPrefix + 'process_cpu_user_seconds_total')) {
      if (collectDefaultMetrics) {
        const opts = {
          prefix: defaultMetricsPrefix
        }
        if (defaultMetricsLabels) {
          opts.labels = defaultMetricsLabels
        }
        prom.collectDefaultMetrics(opts)
      }

      if (labels) {
        prom.register.setDefaultLabels(labels)
      }
    }
    return (req, res, next) => {
      if (req.url === '/metrics' && req.method === 'GET') {
        // respond with metrics report
        try {
          res.set('Content-Type', prom.register.contentType)
          prom.register.metrics().then((m) => {
            res.end(m)
          })
        } catch (ex) {
          res.status(500).end(ex)
        }
      } else {
        next()
      }
    }
  }
}
