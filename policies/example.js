module.exports = {
  name: 'example',
  schema: {
    $id: 'http://express-gateway.io/schemas/policies/example.json',
    type: 'object',
    properties: {},
    required: []
  },
  policy: (actionParams) => {
    return (req, res, next) => {
      if (req.headers.example) {
        res.sendStatus(200);
      } else {
        res.sendStatus(400);
      }
    }
  }
}
