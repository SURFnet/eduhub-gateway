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
const xroute = require('../../lib/xroute')
const collector = {}

// these are the default prom-client buckets, extended up till 5
// minutes. The default buckets go up to 10 seconds
collector.latencyBuckets = [
  0.005, 0.01, 0.025, 0.1, 0.25, 0.5, 1,
  2.5, 5, 10, 30, 60, 120, 240, 300
]

collector.policy = ({
  prefix = 'gateway_',
  labels = null
}) => {
  // When metrics are reconfigured, the gateway needs to be restarted.
  //
  // If the gateway is not restarted the old metrics are kept and not
  // reconfigured

  const requestsTotalMetric = collector.metric(
    prefix + 'incoming_http_requests_total',
    'Counter', {
      help: 'Number of incoming HTTP requests',
      labelNames: ['code', 'path', 'method', 'client', 'num_x_routes']
    },
    labels
  )

  const requestDurationSecondsMetric = collector.metric(
    prefix + 'incoming_http_request_duration_seconds',
    'Histogram',
    {
      help: 'Histogram of latencies for incoming HTTP requests',
      labelNames: ['path', 'method', 'code', 'client', 'num_x_routes'],
      buckets: collector.latencyBuckets
    }
  )

  const concurrentRequestsMetric = collector.metric(
    prefix + 'incoming_concurrent_http_requests',
    'Gauge', {
      help: 'Number of concurrent incoming HTTP requests',
      labelNames: ['path', 'method', 'code', 'client', 'num_x_routes']
    }
  )

  return (req, res, next) => {
    const app = collector.unsafeClientFromRequest(req)
    const endTimer = requestDurationSecondsMetric.startTimer()
    const routes = xroute.decode(req.headers['x-route'])

    const baseLabels = {
      method: req.method,
      path: req.route.path,
      num_x_routes: routes ? routes.length : 0
    }
    if (app) {
      baseLabels.client = app
    }
    concurrentRequestsMetric.labels(baseLabels).inc()
    res.on('close', () => {
      concurrentRequestsMetric.labels(baseLabels).dec()

      const labels = { ...baseLabels, code: res.statusCode }
      requestsTotalMetric.labels(labels).inc()
      endTimer(labels)
    })
    next() // pass request along to the rest of the middleware
  }
}

collector.metric = (name, type, params, labels) => {
  const opts = { name, ...params }
  if (labels) {
    if (opts.labelNames) {
      opts.labelNames = opts.labelNames.concat(Object.keys(labels))
    } else {
      opts.labelNames = Object.keys(labels)
    }
  }
  return prom.register.getSingleMetric(name) || new prom[type](opts)
}

collector.unsafeClientFromRequest = ({ headers: { authorization } }) => {
  const [, credEncoded] = (authorization || '').match(/^Basic\s+(.*)/) || []

  if (credEncoded) {
    const cred = Buffer.from(credEncoded, 'base64').toString('utf-8')
    const [, user] = cred.match(/^([^:]+):(.*)/) || []
    return user
  }
  return null
}

module.exports = collector
