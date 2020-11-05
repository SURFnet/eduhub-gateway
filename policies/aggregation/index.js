module.exports = {
  name: 'aggregation',

  schema: {
    $id: 'http://express-gateway.io/schemas/policies/surfnet-ooapi-gw-aggregation.json',
    type: 'object',
    properties: {},
    required: []
  },

  policy: require('./aggregation.js')
}
