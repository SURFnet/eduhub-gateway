module.exports = {
  // takes an array of middleware functions
  // and returns a middleware function that calls the whole stack
  squashMiddlewareStack: (middlewareStack) => {
    return (req, res, next) => {
      const stack = middlewareStack.slice(); // copy the stack
      const handleNext = (err) => {
        if (err) {
          return next(err);
        }
        var handler = stack.shift(); // get top handler
        return handler(req, res, (err) => {
          if (err || stack.length === 0) {
            // error or last handler in stack called,
            // call next handler from express
            return next(err);
          }
          else {
            return handleNext(); // call next handler in stack
          }
        });
      };
      return handleNext();
    };
  }
}
