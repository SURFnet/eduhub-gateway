const httpProxy = require('http-proxy')

const httpcode = require('../../lib/httpcode')
const xroute = require('../../lib/xroute')
const envelop = require('./envelop')

module.exports = ({ noEnvelopIfAnyHeaders }, { gatewayConfig: { serviceEndpoints } }) => {
  const isEnvelopRequest = (req) => {
    if (noEnvelopIfAnyHeaders) {
      for (const header in noEnvelopIfAnyHeaders) {
        if (req.headers[header.toLowerCase()] === noEnvelopIfAnyHeaders[header]) {
          return false
        }
      }
    }
    return true
  }

  return (req, res, next) => {
    const envelopRequest = isEnvelopRequest(req)
    const endpoints = xroute.decode(req.headers['x-route'])

    if (!endpoints) {
      throw new Error('no endpoints selected, make sure gatekeeper policy configured')
    }

    if (endpoints.length > 1 && !envelopRequest) {
      res.sendStatus(httpcode.BadRequest)
      return
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

      if (envelopRequest) {
        proxy.on('proxyRes', (proxyRes, req, res) => {
          const body = []
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
        target: endpoint.url,
        changeOrigin: true,
        selfHandleResponse: envelopRequest
      })
    })
  }
}
