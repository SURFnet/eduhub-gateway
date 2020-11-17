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

module.exports = {
  name: 'openapi-validator',
  schema: {
    $id: 'http://express-gateway.io/schemas/policies/openapi-validator.json',
    type: 'object',
    properties: {
      apiSpec: {
        type: 'string',
        description: 'path to the OpenAPI specification to use'
      },
      validateRequests: {
        type: 'boolean',
        description: 'whether to validate requests'
      },
      validateResponses: {
        type: 'boolean',
        description: 'whether to validate responses. If true, and the request includes an `X-Validate-Response true` header, the response will be validated'
      }
    },
    required: ['apiSpec']
  },

  policy: require('./openapi-validator')
}
