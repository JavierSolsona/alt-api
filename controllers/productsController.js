const models  = require('../models');
const fs = require('fs');
const { body, param, validationResult } = require('express-validator');
const { IMAGE_UPLOAD_PATH, FILE_UPLOAD_PATH, PUBLIC_PATH, REMOVE_IN_PATH } = require('../constants/app');
const { isImage, isPDF } = require('../utils/customValidators');
const { transformErrors, createErrorUploadFile } = require('../utils/transformErrors');
const {
  NAME_LENGTH,
  ID_INT,
  DESCRIPTION_EMPTY,  
  BAD_REQUEST,
  IMAGE_FORMAT,
  FILE_FORMAT,
  INTERNAL_SERVER_ERROR,
  OBJECT_NOT_FOUND,
  OBJECT_NOT_UPDATED,
  OBJECT_NOT_DELETED
} = require('../constants/errors');
const OBJECT_NAME = "Producto";

exports.validate = (method) => {
  switch (method) {
    case 'create': {
     return [ 
        body('name').isLength({min: 1, max: 255}).withMessage(NAME_LENGTH),
        body('description').isLength({min: 1}).withMessage(DESCRIPTION_EMPTY),
        body('subcategoryId').isInt({min: 1}).withMessage(ID_INT)
       ]   
    }
    case 'urlParameter': {
      return [
        param('productId').isInt({min: 1}).withMessage(ID_INT)
      ]
    }
    case 'update': {
      return [
        param('productId').isInt({min: 1}).withMessage(ID_INT),
        body('name').isLength({min: 1, max: 255}).withMessage(NAME_LENGTH),
        body('description').isLength({min: 1}).withMessage(DESCRIPTION_EMPTY),
        body('subcategoryId').isInt({min: 1}).withMessage(ID_INT)
      ]
    }
  }
}

exports.create = (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).send({errors: transformErrors(errors.array()), message: BAD_REQUEST});
    }

    const imageFilename = (req.files && req.files['image']) ? req.files.image.name : "";
    if(!isImage(imageFilename)){
      return res.status(400).send({errors: createErrorUploadFile(IMAGE_FORMAT,"image"), message: BAD_REQUEST});
    }

    try {
        let image = req.files.image;
        let file, storeValues;
        
        const imagePath = IMAGE_UPLOAD_PATH + Date.now() + image.name;
        
        if (req.files['file']) {
          file = req.files.file;

          if(!isPDF(file.name)){
            return res.status(400).send({errors: createErrorUploadFile(FILE_FORMAT,"file"), message: BAD_REQUEST});
          }

          const filePath = FILE_UPLOAD_PATH + Date.now() + file.name;
          file.mv(filePath);          
          
          storeValues = {
            name: req.body.name,
            description: req.body.description,
            image: imagePath.substring(REMOVE_IN_PATH),
            file: filePath.substring(REMOVE_IN_PATH),
            SubcategoryId: req.body.subcategoryId          
          };
        }else{
          storeValues = {
            name: req.body.name,
            description: req.body.description,
            image: imagePath.substring(REMOVE_IN_PATH),
            SubcategoryId: req.body.subcategoryId          
          };
        }
        
        image.mv(imagePath);

        models.Product.create(storeValues)
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
    models.Product.findAll()
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

    models.Product.findByPk(req.params.productId)
        .then((result) => {
          if(result){
            res.status(200).send(result);
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
  
  const hasImage = req.files && req.files['image'];
  const hasFile = req.files && req.files['file'];
  
  if (hasImage) {
    if(!isImage(req.files.image.name)){
      return res.status(400).send({errors: createErrorUploadFile(IMAGE_FORMAT,"image"), message: BAD_REQUEST});
    }
  }
  
  if (hasFile) {
    if(!isPDF(req.files.file.name)){
      return res.status(400).send({errors: createErrorUploadFile(FILE_FORMAT,"file"), message: BAD_REQUEST});
    }    
  }

  try {
      let file, image, updateValues;

      models.Product.findByPk(req.params.productId)
          .then((result) =>{
              if (result) {
                updateValues = {
                  name: req.body.name,
                  description: req.body.description,
                  image: result.image,
                  file: result.file,
                  SubcategoryId: req.body.subcategoryId          
                };
              
                if (hasImage){
                  image = req.files.image;
                  const imagePath = IMAGE_UPLOAD_PATH + Date.now() + image.name;
                  image.mv(imagePath);
                  
                  updateValues.image = imagePath.substring(REMOVE_IN_PATH);

                  fs.unlink(PUBLIC_PATH + result.image, (err) => {
                    if (err) throw err;
                  });
                }
                
                if (hasFile){
                  file = req.files.file;
                  const filePath = FILE_UPLOAD_PATH + Date.now() + file.name;
                  file.mv(filePath);
                  
                  updateValues.file = filePath.substring(REMOVE_IN_PATH);
                  
                  if(result.file != null){
                    fs.unlink(PUBLIC_PATH + result.file, (err) => {
                      if (err) throw err;
                    });
                  }
                }                
              }
          }).then(() => {
               models.Product.update(updateValues, { where: { id: req.params.productId } })
                .then((modified) => {
                  if (modified[0] === 0) {
                      isModified = false;
                      return res.status(417).send({errors: [], message: OBJECT_NOT_UPDATED.replace("{object}", OBJECT_NAME)});
                  } else {
                      return models.Product.findByPk(req.params.productId)
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
      models.Product.findByPk(req.params.productId)
          .then((result) =>{
              if (result) {
                if(result.file != null){
                  fs.unlink(PUBLIC_PATH + result.file, (err) => {
                    if (err) throw err;
                  });              
                }
                fs.unlink(PUBLIC_PATH + result.image, (err) => {
                  if (err) throw err;
                });              
              }
          }).then(() => {
            models.Product.destroy({where: { id: req.params.productId } })
                .then((deleted) => {
                    if (deleted === 0) {
                      isDeleted = false;
                      res.status(417).send({errors: [], message: OBJECT_NOT_DELETED.replace("{object}", OBJECT_NAME)});
                    } else {
                      return models.Product.findAll();
                    }
                }).then((result) => {
                    if (isDeleted) {
                      return res.status(200).send(result);
                    }
                }).catch(() => {
                    if (isDeleted) {
                      return res.status(500).send({message: "Internal Server Error"});
                    }
                });
          });
    } catch (err) {
      return res.status(500).send({errors: [], message: INTERNAL_SERVER_ERROR});
    }
};