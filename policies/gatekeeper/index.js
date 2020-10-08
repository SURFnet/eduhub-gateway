module.exports = {
  name: 'gatekeeper',

  schema: {
    $id: 'http://express-gateway.io/schemas/policies/surfnet-ooapi-gw-gatekeeper.json',
    type: 'object',
    properties: {},
    required: []
  },

  policy: require('./gatekeeper.js')
}
