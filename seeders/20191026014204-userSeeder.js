'use strict';
const crypto = require('crypto');
const cryptoConstants = require('../config/crypto');

module.exports = {
  up: (queryInterface, Sequelize) => {
    const key = crypto.scryptSync(cryptoConstants.password, cryptoConstants.salt, parseInt(cryptoConstants.number,10));
    const iv = Buffer.alloc(parseInt(cryptoConstants.ivFirst,10), parseInt(cryptoConstants.ivSecond,10));
    const cipher = crypto.createCipheriv(cryptoConstants.algorithm, key, iv);
    let encrypted = cipher.update("FyC0A1T", cryptoConstants.utf8, cryptoConstants.hex);
    encrypted += cipher.final(cryptoConstants.hex);

    return queryInterface.bulkInsert('Users', [{
        email: 'admin@altglocal.com',
        password: encrypted,
        createdAt: new Date(),
        updatedAt: new Date()
      }], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', null, {});
  }
};
