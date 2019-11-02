const models  = require('../models');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const cryptoConstants = require('../config/crypto');
const {
  PASSWORD_BAD_REQUEST,
  EMAIL_NOT_FOUND,
  BAD_REQUEST,
  EMAIL_FORMAT,
  PASSWORD_EMPTY
} = require('../constants/errors');
const { transformErrors } = require('../utils/transformErrors');

exports.validate = () => {
  return [ 
     body('email').isEmail().withMessage(EMAIL_FORMAT),
     body('password').not().isEmpty().withMessage(PASSWORD_EMPTY),
    ]   
}

exports.hasAuthValidFields  = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).send({errors: transformErrors(errors.array()), message: BAD_REQUEST});
  }

  return next();
};

exports.isPasswordAndUserMatch = (req, res, next) => {
    models.User.findOne({ where: {email: req.body.email} })
        .then((user)=>{
            if(user){
              const key = crypto.scryptSync(cryptoConstants.password, cryptoConstants.salt, parseInt(cryptoConstants.number,10));
              const iv = Buffer.alloc(parseInt(cryptoConstants.ivFirst,10), parseInt(cryptoConstants.ivSecond,10));
              const cipher = crypto.createCipheriv(cryptoConstants.algorithm, key, iv);
              let encrypted = cipher.update( req.body.password, cryptoConstants.utf8, cryptoConstants.hex);
              encrypted += cipher.final(cryptoConstants.hex);
              if (encrypted === user.password) {
                  req.body = {
                      userId: user.id,
                      email: user.email,
                      provider: 'email'
                  };
                  return next();
              } else {
                  return res.status(400).send({errors: [], message: PASSWORD_BAD_REQUEST});
              }
            }else{
              return res.status(404).send({errors: [], message: EMAIL_NOT_FOUND});
            }
        });
};