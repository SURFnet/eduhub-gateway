module.exports = {
  name: 'aggregation',

  schema: {
    $id: 'http://express-gateway.io/schemas/policies/surfnet-ooapi-gw-aggregation.json',
    type: 'object',
    properties: {
      noEnvelopIfHeaders: {
        type: 'object'
      }
    },
    required: []
  },

  policy: require('./aggregation.js')
}
