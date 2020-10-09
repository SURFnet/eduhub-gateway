const fs = require('fs')
const path = require('path')

const logger = require('express-gateway/lib/logger').createLoggerWithLabel('[OAGW:Credentials]')

const credentialsFile = path.join(
  __filename, '../../../config/credentials.json'
)

let credentials = null

try {
  fs.watch(credentialsFile, { persistent: false }, () => { credentials = null })
  logger.debug('Watching credentials')

  if (fs.statSync(credentialsFile).mode & 0o04) {
    logger.warn(`Credentials file world readable: ${credentialsFile}`)
  }
} catch (err) {
  if (err.code !== 'ENOENT') {
    logger.warn(`Can't watch ${credentialsFile}: ${err}`)
  }
}

const read = () => {
  if (!credentials) {
    try {
      logger.debug('Loading credentials')
      credentials = JSON.parse(fs.readFileSync(credentialsFile))
    } catch (err) {
      if (err.code === 'ENOENT') {
        credentials = {}
      } else {
        logger.error(`Can't read from ${credentialsFile}: ${err}`)
        process.exit(1)
      }
    }
  }

  return credentials
}

const write = (newCredentials) => {
  try {
    fs.writeFileSync(
      credentialsFile,
      JSON.stringify(credentials, null, 2),
      { mode: 0o600 }
    )

    credentials = newCredentials
  } catch (err) {
    logger.error(`Can't write to ${credentialsFile}: ${err}`)
    process.exit(1)
  }
}

module.exports = { read, write }
