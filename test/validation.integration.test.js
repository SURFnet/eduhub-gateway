const assert = require('assert')
const { httpGet, gwContainer, integrationContext } = require('./integration.environment.js')

integrationContext('validation policy', function () {
  it('should respond with 200 for a correct request', async () => {
    const port = gwContainer().getMappedPort(8080)
    const res = await httpGet(`http://localhost:${port}/courses`)
    assert.strictEqual(res.statusCode, 200)
  })

  it('should respond with 400 when specifying an unknown parameter', async () => {
    const port = gwContainer().getMappedPort(8080)
    const res = await httpGet(`http://localhost:${port}/courses?foo=bar`)
    assert.strictEqual(res.statusCode, 400)
  })
})
