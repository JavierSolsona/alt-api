var express = require('express');
var router = express.Router();
const AuthController = require('../controllers/authController');
const VerifyUserMiddleware = require('../utils/verifyUserMiddleware');

router.post('/',
  VerifyUserMiddleware.validate(),
  [ 
    VerifyUserMiddleware.hasAuthValidFields,
    VerifyUserMiddleware.isPasswordAndUserMatch,
    AuthController.login
  ]
);

module.exports = router;