const models  = require('../models');
const fs = require('fs');
const { body, param, validationResult } = require('express-validator');
const { transformErrors } = require('../utils/transformErrors');
const { PUBLIC_PATH } = require('../constants/app');
const {
  NAME_LENGTH,
  ID_INT,
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  OBJECT_NOT_FOUND,
  OBJECT_NOT_UPDATED,
  OBJECT_NOT_DELETED
} = require('../constants/errors');
const OBJECT_NAME = "Categoria";

exports.validate = (method) => {
  switch (method) {
    case 'create': {
     return [ 
        body('name').isLength({min: 1, max: 255}).withMessage(NAME_LENGTH)
       ]   
    }
    case 'urlParameter': {
      return [
        param('categotyId').isInt({min: 1}).withMessage(ID_INT)
      ]
    }
    case 'update': {
      return [
        param('categotyId').isInt({min: 1}).withMessage(ID_INT),
        body('name').isLength({min: 1, max: 255}).withMessage(NAME_LENGTH)
      ]
    }
  }
}

exports.create = (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).send({errors: transformErrors(errors.array()), message: BAD_REQUEST});
    }

    models.Category.create({name: req.body.name})
        .then((result) => {
            return res.status(201).send(result);
        }).catch((err) => {
            return res.status(500).send({errors: [], message: INTERNAL_SERVER_ERROR});
        });
};

exports.getAll = (req, res) => {
    models.Category.findAll({include : ['Subcategories']})
        .then((result) => {
            return res.status(200).send(result);
        }).catch((err) => {
            return res.status(500).send({errors: [], message: INTERNAL_SERVER_ERROR});
        });
};

exports.getById = (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).send({errors: transformErrors(errors.array()), message: BAD_REQUEST});
    }

    models.Category.findByPk(req.params.categotyId, {include : ['Subcategories']})
        .then((result) => {
          if(result){
            return res.status(200).send(result);
          }else{
            return res.status(417).send({errors: [], message: OBJECT_NOT_FOUND.replace("{object}", OBJECT_NAME)});
          }
        }).catch((err) => {
            return res.status(500).send({errors: [], message: INTERNAL_SERVER_ERROR});
        });
};

exports.update = (req, res) => {
    const errors = validationResult(req);
    let isModified = true;

    if (!errors.isEmpty()) {
      return res.status(400).send({errors: transformErrors(errors.array()), message: BAD_REQUEST});
    }

    models.Category.update({name: req.body.name}, {where: { id: req.params.categotyId } })
        .then((modified) => {
            if (modified[0] === 0) {
                isModified = false;
                return res.status(417).send({errors: [], message: OBJECT_NOT_UPDATED.replace("{object}", OBJECT_NAME)});
            } else {
                return models.Category.findByPk(req.params.categotyId, {include : ['Subcategories']})
            }
        }).then((result) => {
            if (isModified) {
                return res.status(200).send(result);
            }
        }).catch(() => {
            if (isModified) {
                return res.status(500).send({errors: [], message: INTERNAL_SERVER_ERROR});
            }
        });
};

exports.delete = (req, res) => {
    const errors = validationResult(req);
    let isDeleted = true;

    if (!errors.isEmpty()) {
      return res.status(400).send({errors: transformErrors(errors.array()), message: BAD_REQUEST});
    }

    try {
      models.Category.findByPk(req.params.categotyId, {include : ['Subcategories']})
          .then((result) =>{
              if(result) {
                result.Subcategories.map((subcategory) => {
                    fs.unlink(PUBLIC_PATH  + subcategory.image, (err) => {
                      if (err) throw err;
                    });

                    models.Subcategory.findByPk(subcategory.id, {include : ['Products']})
                      .then((result) => {
                        if (result) {
                          result.Products.map((product) =>{
                            fs.unlink(PUBLIC_PATH + product.image, (err) => {
                              if (err) throw err;
                            });
                            
                            if(product.file != null){
                              fs.unlink(PUBLIC_PATH + product.file, (err) => {
                                if (err) throw err;
                              }); 
                            }
                          });
                        }
                      });
                });
              }
          }).then(() => {
            models.Category.destroy({where: { id: req.params.categotyId } })
                .then((deleted) => {
                    if (deleted === 0) {
                        isDeleted = false;
                        res.status(417).send({errors: [], message: OBJECT_NOT_DELETED.replace("{object}", OBJECT_NAME)});
                    } else {
                        return models.Category.findAll({include : ['Subcategories']})
                    }
                }).then((result) => {
                    if (isDeleted) {
                        return res.status(200).send(result);
                    }
                }).catch(() => {
                    if (isDeleted) {
                        return res.status(500).send({errors: [], message: INTERNAL_SERVER_ERROR});
                    }
                });
          });      
    } catch (e) {
      return res.status(500).send({errors: [], message: INTERNAL_SERVER_ERROR});      
    }
};