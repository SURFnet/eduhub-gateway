/* Copyright (C) 2020-2026 SURFnet B.V.
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

const xroute = require('../../lib/xroute')
const { ooapiVersionFromRequest } = require('../../lib/ooapi')

// Create a regex for a path.  Note: only very basic `:param` placeholders are supported.
const pathToRegexp = (path) => new RegExp(`^${path.replaceAll(/:\w+/g, '[^/]+')}$`)

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

const DEFAULT_OOAPI_VERSION = '5'

// given the "raw" acls as provided in the gateway configuration,
// generate a nested map of app-user -> endpoint ->  version -> matcher
// objects
//
// version is a major version, as string: "4", "5". matcher is a
// function that will take a request path and returns a boolean.
const compileAcls = (acls) => (
  acls.reduce((m, { app, endpoints }) => {
    m[app] = endpoints.reduce((appm, { endpoint, paths, version }) => {
      const matcher = compileMatcher(paths)
      if (matcher) {
        appm[endpoint] ||= {}
        appm[endpoint][version || DEFAULT_OOAPI_VERSION] = matcher
      }
      return appm
    }, {})
    return m
  }, {})
)

// Return array for versions allowed for all given endpoints.
const allowedVersions = (acl, endpoints) => (
  Array.from(
    endpoints.slice(1).reduce((versions, endpoint) => (
      versions.intersection(new Set(Object.keys(acl[endpoint])))
    ), new Set(Object.keys(acl[endpoints[0]] || {})))
  )
)

class VersionError extends Error {}

const prepareRequestHeaders = (acl, req) => {
  // When x-route not set, use all endpoints
  if (!req.headers['x-route']) {
    req.headers['x-route'] = xroute.encode(Object.keys(acl), true)
  }

  // Set accept header for correct version
  if (!req.headers.accept) {
    const endpoints = xroute.decode(req.headers['x-route'], true)

    // Only one OOAPI version may be available at this point
    const allowed = allowedVersions(acl, endpoints)
    if (allowed.length !== 1) {
      throw new VersionError("Ambiguous OOAPI version requested, please specify an 'Accept' header")
    }

    req.headers.accept = `application/vnd.oeapi+json;version=${allowed[0]}`
  } else if (!ooapiVersionFromRequest(req)) {
    throw new VersionError(`Accept header not recognized; ${req.headers.accept}`)
  }
}

// NOTE: should be called after prepareRequestHeaders, otherwise
// requested endpoint version may be unknown.
const isAuthorized = (acl, req) => {
  const endpoints = xroute.decode(req.headers['x-route'], true)

  const version = ooapiVersionFromRequest(req)

  if (endpoints.length) {
    return endpoints.reduce(
      (m, endpoint) => {
        // throw version error when there *is* an ACL for this app-endpoint combo, but not with the accepted version
        if (acl?.[endpoint] && !acl[endpoint][version]) {
          throw new VersionError(`Accepted version '${version}' is not available for endpoint '${endpoint}'`)
        }

        // otherwise, do a regular authorization check
        return m && !!acl?.[endpoint]?.[version]?.(req.path)
      },
      true
    )
  } else {
    return false
  }
}

module.exports = {
  compileAcls,
  prepareRequestHeaders,
  isAuthorized,
  VersionError
}
