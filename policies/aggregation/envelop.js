const { URL } = require('url')
const httpcode = require('../../lib/httpcode')

const packageResponses = (req, responses) => ({
  gateway: {
    requestId: req.egContext.requestID,
    request: req.url,
    numberOfEndpoints: responses.length,
    listOfEndpoints: responses.map(([endpoint, res]) => (
      {
        id: endpoint.id,
        name: endpoint.name,
        url: new URL(req.url, endpoint.url).toString(),
        responseCode: res.statusCode || 0
      }
    ))
  },

  endpoint: responses.filter(
    ([, res]) => res.statusCode === httpcode.OK
  ).reduce(
    (m, [{ id }, { body }]) => {
      m[id] = JSON.parse(body)
      return m
    }, {}
  )
})

module.exports = { packageResponses }
