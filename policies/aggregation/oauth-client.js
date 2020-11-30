/* Copyright (C) 2020 SURFnet B.V.
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program. If not, see http://www.gnu.org/licenses/.
 */

const https = require('https')
const http = require('http')
const querystring = require('querystring')
const crypto = require('crypto')
const httpcode = require('../../lib/httpcode')

const logger = require('express-gateway/lib/logger').createLoggerWithLabel('[OAGW:OauthClient]')

const redisNs = 'OAGW-OAUTH2-Token'

const tokenKey = ({ url, params }) => {
  const t = url + JSON.stringify(Object.entries(params).sort())
  return redisNs + '-' + crypto.createHash('sha256').update(t).digest('hex')
}

class PostTokenError extends Error {}

const postToken = (url, params) => {
  logger.debug(`postToken at ${url} for ${params.client_id}`)

  return new Promise(
    (resolve, reject) => {
      try {
        const data = querystring.stringify(params)
        const agent = url.startsWith('https://') ? https : http
        const req = agent.request(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(data)
          }
        }, (res) => {
          let body = ''
          res.on('data', (chunk) => { body += chunk })
          res.on('end', () => {
            res.body = body
            resolve(res)
          })
        })
        req.on('error', err => {
          reject(new PostTokenError(err))
        })
        req.write(data)
        req.end()
      } catch (err) {
        reject(new PostTokenError(err))
      }
    }
  )
}

class AuthorizationError extends Error {}

const authorizationHeader = async ({
  db,
  clientCredentials: {
    tokenEndpoint: { url, params }
  }
}) => {
  const key = tokenKey({ url, params })
  let token = await db.get(key)
  if (!token) {
    logger.debug('Cache miss')

    const res = await postToken(url, params)
    if (res.statusCode !== httpcode.OK) {
      throw new AuthorizationError(
        `Failed to get token: ${url} for ${params.client_id}: ${res.statusCode} / ${res.body}`
      )
    }
    token = res.body

    logger.debug('Caching token')
    db.set(key, token)
    db.expire(key, (res.expires_in || 0) / 0.75) // 75% of ttl just to be safe
  } else {
    logger.debug('Cache hit')
  }
  token = JSON.parse(token)

  return `${token.token_type} ${token.access_token}`
}

module.exports = {
  authorizationHeader,
  AuthorizationError,
  PostTokenError,
  tokenKey
}
