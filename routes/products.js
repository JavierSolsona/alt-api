var express = require('express');
var router = express.Router();
const ProductsController = require('../controllers/productsController');
const ValidationMiddleware = require('../utils/validationMiddleware');

router.post('/', ProductsController.validate('create'), [ValidationMiddleware.validJWTNeeded, ProductsController.create]);
router.get('/', ProductsController.getAll);
router.get('/:productId', ProductsController.validate('urlParameter'), ProductsController.getById);
router.put('/:productId', ProductsController.validate('update'), [ValidationMiddleware.validJWTNeeded, ProductsController.update]);
router.delete('/:productId', ProductsController.validate('urlParameter'), [ValidationMiddleware.validJWTNeeded, ProductsController.delete]);

module.exports = router;