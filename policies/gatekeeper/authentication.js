const crypto = require('crypto')

const hashPassword = (pass, salt) => (
  crypto.createHash('sha256').update(`${pass}-${salt}`).digest('hex')
)

const appFromRequest = (req, apps) => {
  const { headers: { authorization } } = req
  const [, credEncoded] = (authorization || '').match(/^Basic\s+(.*)/) || []

  if (credEncoded) {
    const cred = Buffer.from(credEncoded, 'base64').toString('utf-8')
    const [, user, pass] = cred.match(/^([^:]+):(.*)/) || []
    const app = apps[user]

    if (app && hashPassword(pass, app.passwordSalt) === app.passwordHash) {
      return user
    }
  }

  return null
}

module.exports = {
  hashPassword,
  appFromRequest
}
