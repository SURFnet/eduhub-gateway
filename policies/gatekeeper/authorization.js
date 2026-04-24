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

const SUPPORTED_VERSIONS = new Set(['5', '6'])

// given the "raw" acls as provided in the gateway configuration,
// generate a nested map of app-user -> endpoint -> { versions, matcher
// } objects
//
// versions will be a Set of major versions, as strings: "4", "5" etc.
// and matcher is a function that will take a request path and return
// a boolean.
const compileAcls = (acls) => (
  acls.reduce((m, { app, endpoints }) => {
    m[app] = endpoints.reduce((appm, { endpoint, paths, versions }) => {
      const matcher = compileMatcher(paths)
      if (matcher) {
        appm[endpoint] = { versions: versions ? new Set(versions) : SUPPORTED_VERSIONS, matcher }
      }
      return appm
    }, {})
    return m
  }, {})
)

// which versions of the ooapi are allowed for the given collection of
// endpoints
const allowedVersions = (acl, endpoints) => {
  return endpoints.reduce((versions, endpoint) => {
    if (versions) {
      // if acl has no versions, we will ignore it
      if (acl[endpoint] && acl[endpoint].versions) {
        return versions.intersection(acl[endpoint].versions)
      }
      return versions
    } else {
      return acl[endpoint] && acl[endpoint].versions
    }
  }, SUPPORTED_VERSIONS)
}

class VersionError extends Error {}

const prepareRequestHeaders = (acl, req) => {
  if (!req.headers['x-route']) {
    req.headers['x-route'] = xroute.encode(Object.keys(acl))
  }
  if (!req.headers.accept) {
    const endpoints = xroute.decode(req.headers['x-route'], true)
    const allowed = allowedVersions(acl, endpoints)
    if ((!allowed) || allowed.size === 0) {
      throw new VersionError('No single OOAPI version allowed for these combined endpoints')
    } else if (allowed.size === 1) {
      if (allowed.has('5')) {
        req.headers.accept = 'application/json'
      } else if (allowed.has('6')) {
        req.headers.accept = 'application/vnd.oeapi+json;version=6'
      }
    } else {
      throw new VersionError(`Multiple OOAPI versions allowed; ${Array.from(allowed).join(',')} please specify an 'Accept' header`)
    }
  }
}

const ooapiVersionFromRequest = (req) => {
  const accept = req.headers.accept
  if (!accept) {
    return null
  } else if (accept.startsWith('application/json')) {
    return '5'
  } else {
    const res = accept.match(/^application\/vnd.oeapi\+json\s*;\s*version=(\d+).*/)
    if (res) {
      return res[1]
    }
  }
  return null
}

const isAuthorized = (acl, req) => {
  const endpoints = xroute.decode(req.headers['x-route'], true)
  const version = ooapiVersionFromRequest(req)
  if (!version) {
    throw new VersionError(`Unable to determine OOAPI Version from Accept header '${req.headers.accept}'`)
  }

  if (endpoints.length) {
    return endpoints.reduce(
      (m, endpoint) => {
        if (acl[endpoint] && acl[endpoint].versions && (!acl[endpoint].versions.has(version))) {
          throw new VersionError(`Accepted version '${version}' is not available for endpoints`)
        }
        return m && !!acl[endpoint] && !!acl[endpoint].matcher(req.path)
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
