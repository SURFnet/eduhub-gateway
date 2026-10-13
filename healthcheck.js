const http = require('http')

const options = {
  host: 'localhost',
  port: '8080',
  path: '/health',
  timeout: 1000
}

const request = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`)
  if (res.statusCode === 200) {
    process.exit(0)
  } else {
    process.exit(1)
  }
})

request.on('error', function (err) {
  console.log(err)
  process.exit(1)
})

request.end()
