const httpProxy = require('http-proxy')

const httpcode = require('../../lib/httpcode')
const xroute = require('../../lib/xroute')
const envelop = require('./envelop')

module.exports = (params, { gatewayConfig: { serviceEndpoints } }) => {
  return (req, res, next) => {
    const endpoints = xroute.decode(req.headers['x-route'])

    if (!endpoints) {
      throw new Error('no endpoints selected, make sure gatekeeper policy configured')
    }

    const responses = []
    const endpointDone = (endpoint, proxyRes) => {
      responses.push([endpoint, proxyRes])

      if (responses.length === endpoints.length) {
        res.status(httpcode.OK)
        res.send(envelop.packageResponses(req, responses))
      }
    }

    endpoints.forEach((endpointId) => {
      const endpoint = {
        ...serviceEndpoints[endpointId],
        id: endpointId
      }
      const proxy = httpProxy.createProxyServer()

      proxy.on('proxyRes', (proxyRes, req, res) => {
        const body = []
        proxyRes.on('data', chunk => body.push(chunk))
        proxyRes.on('end', () => {
          proxyRes.body = Buffer.concat(body).toString()
          endpointDone(endpoint, proxyRes)
        })
      })
      proxy.on('error', (e) => endpointDone(endpoint, e))

      proxy.web(req, res, {
        target: endpoint.url,
        changeOrigin: true,
        selfHandleResponse: true
      })
    })
  }
}
