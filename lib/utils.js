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
  // takes an array of middleware functions
  // and returns a middleware function that calls the whole stack
  squashMiddlewareStack: (middlewareStack) => {
    return (req, res, next) => {
      const stack = middlewareStack.slice() // copy the stack
      const handleNext = (err) => {
        if (err) {
          return next(err)
        }
        const handler = stack.shift() // get top handler
        return handler(req, res, (err) => {
          if (err || stack.length === 0) {
            // error or last handler in stack called,
            // call next handler from express
            return next(err)
          } else {
            return handleNext() // call next handler in stack
          }
        })
      }
      return handleNext()
    }
  }
}
