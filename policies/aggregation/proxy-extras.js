/* Copyright (C) 2020, 2023 SURFnet B.V.
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

const logger = require('express-gateway-lite/lib/logger').createLoggerWithLabel('[OAGW:ProxyExtras]')

const oauthClient = require('./oauth-client')
const secrets = require('../../lib/secrets')

module.exports = {
  proxyOptionsForEndpoint: async ({
    db,
    endpoint: {
      proxyOptions,
      proxyOptionsEncoded
    }
  }) => {
    if (proxyOptions) {
      logger.warn('clear text proxyOptions in configuration')
    }

    const options = proxyOptionsEncoded
      ? await secrets.decode(proxyOptionsEncoded)
      : proxyOptions
    const { oauth2, ...opts } = options || {}
    opts.headers = opts.headers || {}
    if (oauth2) {
      const auth = await oauthClient.authorizationHeader({ db, ...oauth2 })
      opts.headers.authorization = auth
    }

    return opts
  }
}
