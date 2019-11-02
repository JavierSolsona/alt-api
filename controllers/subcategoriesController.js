const models  = require('../models');
const fs = require('fs');
const { body, param, validationResult } = require('express-validator');
const { IMAGE_UPLOAD_PATH, PUBLIC_PATH, REMOVE_IN_PATH } = require('../constants/app');
const { isImage } = require('../utils/customValidators');
const { transformErrors, createErrorUploadFile } = require('../utils/transformErrors');
const {
  NAME_LENGTH,
  ID_INT,
  BAD_REQUEST,
  IMAGE_FORMAT,
  INTERNAL_SERVER_ERROR,
  OBJECT_NOT_FOUND,
  OBJECT_NOT_UPDATED,
  OBJECT_NOT_DELETED
} = require('../constants/errors');
const OBJECT_NAME = "Subcategoria";

exports.validate = (method) => {
  switch (method) {
    case 'create': {
     return [ 
        body('name').isLength({min: 1, max: 255}).withMessage(NAME_LENGTH),
        body('categoryId').isInt({min: 1}).withMessage(ID_INT)
       ]   
    }
    case 'urlParameter': {
      return [
        param('subcategotyId').isInt({min: 1}).withMessage(ID_INT)
      ]
    }
    case 'update': {
      return [
        param('subcategotyId').isInt({min: 1}).withMessage(ID_INT),
        body('name').isLength({min: 1, max: 255}).withMessage(NAME_LENGTH),
        body('categoryId').isInt({min: 1}).withMessage(ID_INT),
      ]
    }
  }
}

exports.create = (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).send({errors: transformErrors(errors.array()), message: BAD_REQUEST});
    }
    
    const filename = (req.files && req.files['image']) ? req.files.image.name : "";
    if(!isImage(filename)){
      return res.status(400).send({errors: createErrorUploadFile(IMAGE_FORMAT,"image"), message: BAD_REQUEST});
    }

    try {
        let image = req.files.image;
        
        const imagePath = IMAGE_UPLOAD_PATH + Date.now() + image.name;

        image.mv(imagePath);

        models.Subcategory.create({name: req.body.name, image: imagePath.substring(REMOVE_IN_PATH), CategoryId: req.body.categoryId})
            .then((result) => {
                return res.status(201).send(result);
            }).catch((err) => {
                return res.status(500).send({errors: [], message: INTERNAL_SERVER_ERROR});
            });
    } catch (err) {
        return res.status(500).send({errors: [], message: INTERNAL_SERVER_ERROR});
    }
};

exports.getAll = (req, res) => {
    models.Subcategory.findAll({include : ['Products']})
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

    models.Subcategory.findByPk(req.params.subcategotyId, {include : ['Products']})
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

    try {
        const hasImage = (req.files && req.files['image']) ? true : false;
        let jsonUpdate;
        
        if(hasImage){
          let image = req.files.image;
          
          if(!isImage(image.name)){
            return res.status(400).send({errors: createErrorUploadFile(IMAGE_FORMAT,"image"), message: BAD_REQUEST});
          }
          
          const imagePath = IMAGE_UPLOAD_PATH + Date.now() + image.name;

          image.mv(imagePath);
          
          jsonUpdate = {
            name: req.body.name,
            image: imagePath.substring(REMOVE_IN_PATH),
            CategoryId: req.body.categoryId
          };          
        }else{
          jsonUpdate = {
            name: req.body.name,
            CategoryId: req.body.categoryId
          };
        }
        
        models.Subcategory.findByPk(req.params.subcategotyId)
            .then((result) =>{
                if (result && hasImage){
                  fs.unlink( PUBLIC_PATH + result.image, (err) => {
                    if (err) throw err;
                  });
                }
            }).then((modified) => {
                models.Subcategory.update(jsonUpdate, { where: { id: req.params.subcategotyId } })
                  .then((modified) => {
                    if (modified[0] === 0) {
                        isModified = false;
                        return res.status(417).send({errors: [], message: OBJECT_NOT_UPDATED.replace("{object}", OBJECT_NAME)});
                    } else {
                        return models.Subcategory.findByPk(req.params.subcategotyId, {include : ['Products']})
                    }
                  }).then((result) => {
                    if(isModified){
                        return res.status(200).send(result);
                    }
                  }).catch(() => {
                      if(isModified){
                        return res.status(500).send({errors: [], message: INTERNAL_SERVER_ERROR});
                      }
                  });
            });
    } catch (err) {
        return res.status(500).send({errors: [], message: INTERNAL_SERVER_ERROR});
    }        
};

exports.delete = (req, res) => {
    const errors = validationResult(req);
    let isDeleted = true;

    if (!errors.isEmpty()) {
      return res.status(400).send({errors: transformErrors(errors.array()), message: BAD_REQUEST});
    }

    try {
      models.Subcategory.findByPk(req.params.subcategotyId, {include : ['Products']})
          .then((result) =>{
              if(result) {
                fs.unlink(PUBLIC_PATH  + result.image, (err) => {
                  if (err) throw err;
                });
                
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
          }).then(() => {
            models.Subcategory.destroy({where: { id: req.params.subcategotyId } })
                .then((deleted) => {
                    if (deleted === 0) {
                        isDeleted = false;
                        res.status(417).send({errors: [], message: OBJECT_NOT_DELETED.replace("{object}", OBJECT_NAME)});
                    } else {
                        return models.Subcategory.findAll({include : ['Products']})
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
    } catch (err) {
        return res.status(500).send({errors: [], message: INTERNAL_SERVER_ERROR});
    }
        
};