module.exports = {
  name: 'gatekeeper',

  schema: {
    $id: 'http://express-gateway.io/schemas/policies/surfnet-ooapi-gw-gatekeeper.json',
    type: 'object',
    properties: {
      apps: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'passwordHash', 'passwordSalt'],
          properties: {
            id: {type: 'string'},
            passwordHash: {type: 'string'},
            passwordSalt: {type: 'string'}
          }
        }
      }
    },
    required: ['apps']
  },

  policy: require('./gatekeeper.js')
}
