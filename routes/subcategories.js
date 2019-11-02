var express = require('express');
var router = express.Router();
const SubcategoriesController = require('../controllers/subcategoriesController');
const ValidationMiddleware = require('../utils/validationMiddleware');

router.post('/', SubcategoriesController.validate('create'),[ValidationMiddleware.validJWTNeeded, SubcategoriesController.create]);
router.get('/', SubcategoriesController.getAll);
router.get('/:subcategotyId', SubcategoriesController.validate('urlParameter'), SubcategoriesController.getById);
router.put('/:subcategotyId', SubcategoriesController.validate('update'), [ValidationMiddleware.validJWTNeeded, SubcategoriesController.update]);
router.delete('/:subcategotyId', SubcategoriesController.validate('urlParameter'), [ValidationMiddleware.validJWTNeeded, SubcategoriesController.delete]);

module.exports = router;