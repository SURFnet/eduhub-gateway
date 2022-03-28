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

const httpProxy = require('http-proxy')

const logger = require('express-gateway-lite/lib/logger').createLoggerWithLabel('[OAGW:Aggregation]')
const jsonLog = require('../../lib/json_log')

const httpcode = require('../../lib/httpcode')
const xroute = require('../../lib/xroute')
const envelop = require('./envelop')
const { proxyOptionsForEndpoint } = require('./proxy-extras')
const { keepHeadersFilter } = require('./keep-headers')
const collector = require('../metrics-collector/metrics-collector')

module.exports = (config, { gatewayConfig: { serviceEndpoints } }) => {
  logger.info(`initializing aggregation policy for ${Object.keys(serviceEndpoints)}`)

  // Note: can not require db earlier because EG configuration might
  // not be fully loaded yet causing a deadlock.
  const db = require('express-gateway-lite/lib/db')

  const isEnvelopRequest = (req) => {
    if (config.noEnvelopIfAnyHeaders) {
      for (const header in config.noEnvelopIfAnyHeaders) {
        if (req.headers[header.toLowerCase()] === config.noEnvelopIfAnyHeaders[header]) {
          return false
        }
      }
    }
    return true
  }

  const keepRequestHeaders = keepHeadersFilter(config.keepRequestHeaders)
  const keepResponseHeaders = keepHeadersFilter(config.keepResponseHeaders)

  const prefix = config.metricsPrefix || 'gateway_'

  // Metrics need to be functions because the registry will be cleared
  // when the configuration is reloaded (when the metrics-reporter is
  // re-initialized) which may be after this policy is initialized
  const requestsTotalMetric = collector.metric(
    prefix + 'outgoing_http_requests_total',
    'Counter', {
      help: 'Number of outgoing HTTP requests',
      labelNames: ['code', 'path', 'method', 'endpoint', 'client']
    }
  )
  const concurrentRequestsMetric = collector.metric(
    prefix + 'outgoing_concurrent_http_requests_total',
    'Gauge', {
      help: 'Number of concurrent outgoing HTTP requests',
      labelNames: ['path', 'method', 'endpoint', 'client']
    }
  )
  const requestDurationSecondsMetric = collector.metric(
    prefix + 'outgoing_http_request_duration_seconds',
    'Histogram',
    {
      help: 'Histogram of latencies for outgoing HTTP requests',
      labelNames: ['path', 'method', 'code', 'endpoint', 'client'],
      buckets: collector.latencyBuckets
    }
  )

  return (req, res, next) => {
    const envelopRequest = isEnvelopRequest(req)
    const endpoints = xroute.decode(req.headers['x-route'])
    const requestId = req.egContext.requestID
    if (!endpoints) {
      throw new Error('no endpoints selected, make sure gatekeeper policy configured')
    }

    if (endpoints.length > 1 && !envelopRequest) {
      res.sendStatus(httpcode.BadRequest)
      return
    }

    if (config.keepRequestHeaders) {
      keepRequestHeaders(req.headers)
    }

    const responses = []
    const endpointDone = (endpoint, proxyRes) => {
      if (res.writableEnded) return
      responses.push([endpoint, proxyRes])

      if (responses.length === endpoints.length) {
        res.status(httpcode.OK)
        res.send(envelop.packageResponses(req, responses))
      }
    }

    endpoints.forEach(async (endpointId) => {
      if (res.writableEnded) return

      try {
        const endpoint = {
          ...serviceEndpoints[endpointId],
          id: endpointId
        }
        const proxy = httpProxy.createProxyServer()
        const reqTimerStart = new Date()
        // setup logging and metrics
        const app = req.egContext.app
        const labels = {
          method: req.method,
          path: req.route.path,
          endpoint: endpointId,
          client: app
        }
        concurrentRequestsMetric.labels(labels).inc()

        proxy.on('proxyRes', (proxyRes, req, res) => {
          const remoteUrl = endpoint.url.replace(/\/$/, '') + req.url
          const statusCode = proxyRes.statusCode
          const method = req.method
          proxy.on('end', () => {
            const reqTimerEnd = new Date()
            jsonLog.info({
              short_message: `${requestId} - ${method} ${remoteUrl} ${statusCode}`,
              trace_id: requestId,
              client: 'PROXY',
              http_status: statusCode,
              request_method: method,
              url: remoteUrl,
              time_ms: reqTimerEnd - reqTimerStart
            })
            requestsTotalMetric.labels({ ...labels, code: statusCode }).inc()
            concurrentRequestsMetric.labels(labels).dec()
            requestDurationSecondsMetric.labels({ ...labels, code: statusCode }).observe((reqTimerEnd - reqTimerStart) / 1000)
          })
        })
        // Error here means we got no HTTP response (timeout or
        // service not available), meaning we have no HTTP status. We
        // log status code "0" in this case.
        proxy.on('error', (e) => {
          const reqTimerEnd = new Date()
          jsonLog.error({
            short_message: `${requestId} - ${e} 0`,
            trace_id: requestId,
            client: 'PROXY',
            error_msg: e.toString(),
            http_status: 0
          })
          requestsTotalMetric.labels({ ...labels, code: 0 }).inc()
          concurrentRequestsMetric.labels(labels).dec()
          requestDurationSecondsMetric.labels({ ...labels, code: 0 }).observe((reqTimerEnd - reqTimerStart) / 1000)
        })

        if (envelopRequest) {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            if (config.keepResponseHeaders) {
              keepResponseHeaders(proxyRes.headers)
            }

            const body = []
            proxyRes.on('error', (e) => {
              logger.warn(e)
            })
            proxyRes.on('data', chunk => body.push(chunk))
            proxyRes.on('end', () => {
              proxyRes.body = Buffer.concat(body).toString()
              endpointDone(endpoint, proxyRes)
            })
          })
          proxy.on('error', (e) => endpointDone(endpoint, e))
        } else {
          proxy.on('error', () => res.sendStatus(httpcode.BadGateway))
        }
        proxy.web(req, res, {
          ...await proxyOptionsForEndpoint({ db, endpoint }),
          target: endpoint.url,
          changeOrigin: true,
          selfHandleResponse: envelopRequest
        })
      } catch (err) {
        logger.warn(err)
        res.sendStatus(httpcode.InternalServerError).end()
      }
    })
  }
}
