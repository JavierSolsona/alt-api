const jwt = require('jsonwebtoken');
const jwtConstants = require('../config/jwt');
const { UNAUTHORIZED, FORBIDDEN } = require('../constants/errors');

exports.validJWTNeeded = (req, res, next) => {
    if (req.headers['authorization']) {
        try {
            let authorization = req.headers['authorization'].split(' ');
            if (authorization[0] !== 'Bearer') {
                return res.status(401).send({errors: [], message: UNAUTHORIZED});
            } else {
                req.jwt = jwt.verify(authorization[1], jwtConstants.jwtSecret);
                return next();
            }
        } catch (err) {
            return res.status(403).send({errors: [], message: FORBIDDEN});
        }
    } else {
        return res.status(401).send({errors: [], message: UNAUTHORIZED});
    }
};