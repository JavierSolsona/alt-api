var express = require('express');
var router = express.Router();
const CategoriesController = require('../controllers/categoriesController');
const ValidationMiddleware = require('../utils/validationMiddleware');

router.post('/', CategoriesController.validate('create'), [ValidationMiddleware.validJWTNeeded, CategoriesController.create]);
router.get('/', CategoriesController.getAll);
router.get('/:categotyId', CategoriesController.validate('urlParameter'), CategoriesController.getById);
router.put('/:categotyId', CategoriesController.validate('update'),  [ValidationMiddleware.validJWTNeeded, CategoriesController.update]);
router.delete('/:categotyId', CategoriesController.validate('urlParameter'),  [ValidationMiddleware.validJWTNeeded, CategoriesController.delete]);

module.exports = router;