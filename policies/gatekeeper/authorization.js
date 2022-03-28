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

const { pathToRegexp } = require('path-to-regexp')
const xroute = require('../../lib/xroute')

// Given a collection of `paths` with `:param` placeholders, return a
// function that matches an actual path (returns true if the given
// path matches any of the paths in the collection).
//
// If `paths` is empty, returns null
const compileMatcher = (paths) => {
  if (paths.length) {
    const rx = new RegExp(paths.map(path => pathToRegexp(path).source).join('|'))
    return (path) => rx.exec(path)
  } else {
    return null
  }
}

const compileAcls = (acls) => (
  acls.reduce((m, { app, endpoints }) => {
    m[app] = endpoints.reduce((appm, { endpoint, paths }) => {
      const matcher = compileMatcher(paths)
      if (matcher) {
        appm[endpoint] = matcher
      }
      return appm
    }, {})
    return m
  }, {})
)

const prepareRequestHeaders = (acl, req) => {
  if (!req.headers['x-route']) {
    req.headers['x-route'] = xroute.encode(Object.keys(acl))
  }
}

const isAuthorized = (acl, req) => {
  const endpoints = xroute.decode(req.headers['x-route'])

  if (endpoints.length) {
    return endpoints.reduce(
      (m, endpoint) => m && !!acl[endpoint] && !!acl[endpoint](req.path),
      true
    )
  } else {
    return false
  }
}

module.exports = {
  compileAcls,
  prepareRequestHeaders,
  isAuthorized
}
