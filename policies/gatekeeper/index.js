module.exports = {
  name: 'gatekeeper',

  schema: {
    $id: 'http://express-gateway.io/schemas/policies/surfnet-ooapi-gw-gatekeeper.json',
    type: 'object',
    properties: {
      credentials: { type: 'string' },
      acls: {
        type: 'array',
        items: {
          type: 'object',
          required: ['app', 'endpoints'],
          properties: {
            app: { type: 'string' },
            endpoints: {
              type: 'array',
              items: {
                type: 'object',
                required: ['endpoint', 'paths'],
                properties: {
                  endpoint: { type: 'string' },
                  paths: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    required: ['acls']
  },

  policy: require('./gatekeeper.js')
}
