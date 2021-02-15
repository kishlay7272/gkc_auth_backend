const jwt = require('express-jwt');
const { secret } = require('config.json');
const db = require('_helpers/db');


module.exports = authorize;
function authorize(roles = []) {
    if (typeof roles === 'string') {
        roles = [roles];
    }
    return [
        // authenticate JWT token and attach decoded token to request as req.user
        jwt({ secret, algorithms: ['HS256'] }),

        // attach full user record to request object
        async (req, res, next) => {
            // get user with id from token 'sub' (subject) property
            const user = await db.User.findByPk(req.user.sub);

            if (roles.length && !roles.includes(user.user_type)) {
                // user's role is not authorized
                return res.status(401).json({ message: 'Unauthorized' });
            }
           
            // check user still exists
            if (!user)
                return res.status(401).json({ message: 'Unauthorized' });

            // authorization successful
            req.user = user.get();
            next();
        }
    ];
}
