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

const logger = require('express-gateway-lite/lib/logger').createLoggerWithLabel('[OAGW:OauthClient]')

const redisNs = 'OAGW-OAUTH2-Token'

const tokenKey = ({ url, params }) => {
  const t = url + JSON.stringify(Object.entries(params).sort())
  return redisNs + '-' + crypto.createHash('sha256').update(t).digest('hex')
}

class AuthorizationError extends Error {
  constructor (message, { cause, statusCode, ...exInfo }) {
    super(message, { cause })
    this.statusCode = statusCode
    this.exInfo = exInfo
  }
}

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
          reject(new AuthorizationError(
            `Failed to connect: ${url} for ${params.client_id}`, {
              url,
              statusCode: httpcode.ServiceUnavailable,
              clientId: params.client_id,
              cause: err
            }
          ))
        })
        req.write(data)
        req.end()
      } catch (err) {
        reject(new AuthorizationError(
          `Failed to request: ${url} for ${params.client_id}`, {
            url,
            statusCode: httpcode.InternalServerError,
            clientId: params.client_id,
            cause: err
          }
        ))
      }
    }
  )
}

const authorizationHeader = async ({
  db,
  clientCredentials: {
    tokenEndpoint: { url, params }
  }
}) => {
  const key = tokenKey({ url, params })
  let token = await db.get(key)

  let tokenParsed
  try { tokenParsed = token && JSON.parse(token) } catch (_) { /* bad token */ }

  if (!tokenParsed) {
    logger.debug('Cache miss')

    const res = await postToken(url, params)
    if (res.statusCode !== httpcode.OK) {
      throw new AuthorizationError(
        `Failed to get token: ${url} for ${params.client_id}: ${res.statusCode}`, {
          url,
          statusCode: res.statusCode,
          clientId: params.client_id
        }
      )
    }
    token = res.body

    try {
      tokenParsed = JSON.parse(token)
    } catch (err) {
      throw new AuthorizationError(
        `Failed to parse token: ${url} for ${params.client_id}`, {
          url,
          statusCode: httpcode.InternalServerError,
          clientId: params.client_id,
          cause: err
        }
      )
    }

    logger.debug('Caching token')
    db.set(key, token)

    // 75% of ttl just to be safe
    const expire = Math.floor((tokenParsed.expires_in || 0) * 0.75)
    db.expire(key, expire)
  } else {
    logger.debug('Cache hit')
  }

  return `${tokenParsed.token_type} ${tokenParsed.access_token}`
}

module.exports = {
  authorizationHeader,
  AuthorizationError,
  tokenKey
}
