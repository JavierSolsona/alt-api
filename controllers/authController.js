const models  = require('../models');
const jwt = require('jsonwebtoken');
const jwtConstants = require('../config/jwt');
const { INTERNAL_SERVER_ERROR } = require('../constants/errors');

exports.login = (req, res) => {
    try {
        const token = jwt.sign(req.body, jwtConstants.jwtSecret, {expiresIn: jwtConstants.jwtExpiration});
        res.status(201).send({accessToken: token});
    } catch (err) {
        res.status(500).send({errors: [], message: INTERNAL_SERVER_ERROR});
    }
};
