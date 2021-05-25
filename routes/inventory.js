'use strict';

const httpError = require('../utils/http-error');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const authenticate = require('../authenticate');
const Inventory = require('../models/inventory');
const User = require('../models/user');
const Recipe = require('../models/recipe-master');
const imageFileHandler = require('./images/image-helpers');
const upload = multer(
  {
    dest: 'brew-io-uploads/tmp/',
    fileFilter: (req, file, cb) => {
      cb(null, file.originalname !== '0.jpg');
    },
    limits: {
      fileSize: 500 * 1024, // 500 kB
      files: 2
    }
  }
);
const storeDir = '../../brew-io-uploads/images';
const inventoryFields = [
  { name: 'itemLabelImage', maxCount: 1 },
  { name: 'supplierLabelImage', maxCount: 1 }
];

const inventoryRouter = express.Router();

inventoryRouter.use(bodyParser.json());

inventoryRouter.route('/')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user === null) {
          throw httpError(404, 'Could not find user document');
        }
        return Inventory.find({_id: {$in: user.inventoryList} });
      })
      .then(inventory => {
        if (inventory === null) {
          throw httpError(404, 'Inventory not found');
        }
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(inventory);
      })
      .catch(next);
  })
  .post(authenticate.verifyUser, upload.fields(inventoryFields), (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user === null) {
          throw httpError(404, 'Could not find user record');
        }

        const parsedDoc = JSON.parse(req.body.inventoryItem);

        return Inventory.create(parsedDoc)
          .then(newItem => {
            const storeImages = [];

            if (req.files.itemLabelImage && req.files.itemLabelImage.length && req.files.itemLabelImage[0].cid !== '0') {
              storeImages.push(imageFileHandler.storeImage(req.files.itemLabelImage[0]));
            }

            if (req.files.supplierLabelImage && req.files.supplierLabelImage.length && req.files.supplierLabelImage[0].cid !== '0') {
              storeImages.push(imageFileHandler.storeImage(req.files.supplierLabelImage[0]));
            }

            return Promise.all(storeImages)
              .then(storedImages => {
                storedImages.forEach(storedImage => {
                  if (storedImage.fieldname === 'itemLabelImage') {
                    newItem.optionalItemData.itemLabelImage.serverFilename
                      = storedImage.filename;
                    newItem.optionalItemData.itemLabelImage.hasPending = false;
                  }

                  if (storedImage.fieldname === 'supplierLabelImage') {
                    newItem.optionalItemData.supplierLabelImage.serverFilename
                      = storedImage.filename;
                    newItem.optionalItemData.supplierLabelImage.hasPending = false;
                  }
                });

                return newItem.save();
              });
          })
          .then(completedItem => {
            user.inventoryList.push(completedItem);
            return user.save()
              .then(_update => {
                res.statusCode = 201;
                res.setHeader('content-type', 'application/json');
                res.json(completedItem);
              });
          });
      })
      .catch(next);
  });

inventoryRouter.route('/:itemId')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user === null) {
          throw httpError(404, 'Could not find user record');
        }
        return Inventory.findById(req.params.itemId)
          .then(item => {
            if (item !== null) {
              res.statusCode = 200;
              res.setHeader('content-type', 'application/json');
              return res.json(item);
            }
            throw httpError(404, 'Could not find inventory record');
          });
      })
      .catch(error => next(error));
  })
  .patch(authenticate.verifyUser, upload.fields(inventoryFields), (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user === null) {
          throw httpError(404, 'Could not find user record');
        }

        const parsedDoc = JSON.parse(req.body.inventoryItem);

        return Inventory.findByIdAndUpdate(req.params.itemId, { $set: parsedDoc }, {new: true})
          .then(updatedItem => {
            const storeImages = [];

            if (req.files.itemLabelImage && req.files.itemLabelImage.length && req.files.itemLabelImage[0].cid !== '0') {
              storeImages.push(imageFileHandler.storeImage(req.files.itemLabelImage[0]));
            }

            if (req.files.supplierLabelImage && req.files.supplierLabelImage.length && req.files.supplierLabelImage[0].cid !== '0') {
              storeImages.push(imageFileHandler.storeImage(req.files.supplierLabelImage[0]));
            }

            return Promise.all(storeImages)
              .then(storedImages => {
                const deleteImages = [];

                storedImages.forEach(storedImage => {
                  if (storedImage.fieldname === 'itemLabelImage') {
                    deleteImages.push(
                      imageFileHandler.deleteImage(
                        updatedItem.optionalItemData.itemLabelImage.serverFilename
                      )
                    );

                    updatedItem.optionalItemData.itemLabelImage.serverFilename
                      = storedImage.filename;
                    updatedItem.optionalItemData.itemLabelImage.hasPending = false;
                  }

                  if (storedImage.fieldname === 'supplierLabelImage') {
                    deleteImages.push(
                      imageFileHandler.deleteImage(
                        updatedItem.optionalItemData.supplierLabelImage.serverFilename
                      )
                    );

                    updatedItem.optionalItemData.supplierLabelImage.serverFilename
                      = storedImage.filename;
                    updatedItem.optionalItemData.supplierLabelImage.hasPending = false;
                  }
                });

                return Promise.all([ updatedItem.save(), ...deleteImages ]);
              });
          })
          .then(results => {
            const completedItem = results[0];
            user.inventoryList.push(completedItem);
            return user.save()
              .then(_update => {
                res.statusCode = 200;
                res.setHeader('content-type', 'application/json');
                res.json(completedItem);
              });
          });
      })
      .catch(next);
  })
  .delete(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user === null) {
          throw httpError(404, 'Could not find user record');
        }

        return Inventory.findByIdAndDelete(req.params.itemId)
          .then(dbres => {
            if (dbres === null) {
              throw httpError(404, 'Could not find inventory record');
            }

            const deleteImages = [];

            if (dbres.optionalItemData && dbres.optionalItemData.itemLabelImage) {
              deleteImages.push(imageFileHandler.deleteImage(dbres.optionalItemData.itemLabelImage.serverFilename));
            }

            if (dbres.optionalItemData && dbres.optionalItemData.supplierLabelImage) {
              deleteImages.push(imageFileHandler.deleteImage(dbres.optionalItemData.supplierLabelImage.serverFilename));
            }

            return Promise.all(deleteImages)
              .then(() => {
                const toDeleteIndex = user.inventoryList
                  .findIndex(item => {
                    return item._id.equals(req.params.itemId);
                  });

                user.inventoryList.splice(toDeleteIndex, 1);

                return user.save()
                  .then(() => {
                    res.statusCode = 200;
                    res.setHeader('content-type', 'application/json');
                    res.json(dbres);
                  });
              });
          });
      })
      .catch(next);
  });

module.exports = inventoryRouter;
