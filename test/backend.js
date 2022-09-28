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

const status = require('../lib/httpcode')
const express = require('express')

module.exports = {
  start: (data, port, ...middleware) => {
    const app = express()
    app.use(function (req, res, next) {
      // check that incoming request accept header
      // is exactly correct

      if (req.headers.accept !== 'application/json') {
        console.log('accept header not application/json', req.headers)
        return res.status(status.NotAcceptable).send('Not acceptable')
      }

      // ensure that, if we have a request like '/courses?foo=bar'
      // it gets mapped to '/courses.json'
      //
      // leave paths that end in '/' alone (for root url), assumes
      // there is an index.json for that
      req.url = req.url.replace(/([^/])(\?|$).*/, '$1.json')
      next()
    })
    middleware && middleware.forEach(v => app.use(v))
    app.use(express.static(data, { index: 'index.json', extensions: ['json'], forwardError: true, redirect: true }))
    return app.listen(port)
  }
}
