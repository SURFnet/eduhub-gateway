const { URL } = require('url')
const httpcode = require('../../lib/httpcode')

const packageResponses = (req, responses) => {
  const gateway = {
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
  }

  const endpoint = responses.filter(
    ([, res]) => res.statusCode === httpcode.OK
  ).reduce(
    (m, [{ id }, { body }]) => {
      m[id] = JSON.parse(body)
      return m
    }, {}
  )
  return { gateway, endpoint }
}

module.exports = { packageResponses }
