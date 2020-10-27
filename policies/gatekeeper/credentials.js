const fs = require('fs')
const path = require('path')

const logger = require('express-gateway/lib/logger').createLoggerWithLabel('[OAGW:Credentials]')

const configFile = (filename) => path.join(__filename, `../../../config/${filename}`)
const defaultCredentialsFile = configFile('credentials.json')

let credentials = null

try {
  fs.watch(defaultCredentialsFile, { persistent: false }, () => { credentials = null })
  logger.debug('Watching credentials')

  if (fs.statSync(defaultCredentialsFile).mode & 0o04) {
    logger.warn(`Credentials file world readable: ${defaultCredentialsFile}`)
  }
} catch (err) {
  if (err.code !== 'ENOENT') {
    logger.warn(`Can't watch ${defaultCredentialsFile}: ${err}`)
  }
}

const read = (filename) => {
  if (!credentials) {
    const file = filename ? configFile(filename) : defaultCredentialsFile
    try {
      logger.debug('Loading credentials')
      credentials = JSON.parse(fs.readFileSync(file))
    } catch (err) {
      if (err.code === 'ENOENT') {
        credentials = {}
      } else {
        logger.error(`Can't read from ${file}: ${err}`)
        process.exit(1)
      }
    }
  }

  return credentials
}

const write = (newCredentials) => {
  try {
    fs.writeFileSync(
      defaultCredentialsFile,
      JSON.stringify(credentials, null, 2),
      { mode: 0o600 }
    )

    credentials = newCredentials
  } catch (err) {
    logger.error(`Can't write to ${defaultCredentialsFile}: ${err}`)
    process.exit(1)
  }
}

module.exports = { read, write }
