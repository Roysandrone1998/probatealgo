const passport = require('passport');


function authMiddleware(req, res, next) {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            return next(err);
        }

        res.locals.isAuthenticated = !!user;
        req.user = user || null;
        next();
    })(req, res, next);
}

module.exports = authMiddleware;