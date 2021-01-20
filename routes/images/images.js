'use strict';

/* module imports */
const httpError = require('../utils/http-error');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/* app imports */
const authenticate = require('../authenticate');
const Inventory = require('../models/inventory');
const User = require('../models/user');
const Recipe = require('../models/recipe-master');
const imageFileHandler = require('./image-helpers');
const upload = multer(
  {
    dest: 'brew-io-uploads/tmp/',
    fileFilter: (req, file, cb) => {
      cb(null, file.originalname !== '0.jpg');
    },
    limits: {
      // fileSize: 500 * 1024, // 500 kB
      files: 2
    }
  }
);
const storeDir = '../../../brew-io-uploads/images';
const inventoryFields = [
  { name: 'itemLabelImage', maxCount: 1 },
  { name: 'supplierLabelImage', maxCount: 1 }
];

/* router setup */
const imageRouter = express.Router();

imageRouter.use(bodyParser.json());


imageRouter.route('/:imageId')
  .get((req, res, next) => {
    res.sendFile(path.join(__dirname, `${storeDir}/${req.params.imageId}.jpg`));
  });

imageRouter.route('/inventory/:itemId')
  .post(authenticate.verifyUser, upload.fields(inventoryFields), (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user === null) {
          throw httpError(404, 'Could not find user');
        }

        return Inventory.findById(req.params.itemId)
          .then(item => {
            if (item === null) {
              throw httpError(404, 'Could not find inventory item');
            }

            const storeImages = [];
            console.log('files', req.files);

            if (req.files.itemLabelImage && req.files.itemLabelImage.length && req.files.itemLabelImage[0].cid !== 'missing') {
              console.log('adding item label image');
              storeImages.push(imageFileHandler.storeImage(req.files.itemLabelImage[0]));
              storeImages.push(imageFileHandler.deleteImage(path.join(__dirname, `${storeDir}/${item.optionalItemData.itemLabelImage.serverFilename}.jpg`)));
            }

            if (req.files.supplierLabelImage && req.files.supplierLabelImage.length && req.files.supplierLabelImage[0].cid !== 'missing') {
              console.log('adding supplier label image');
              storeImages.push(imageFileHandler.storeImage(req.files.supplierLabelImage[0]));
              storeImages.push(imageFileHandler.deleteImage(path.join(__dirname, `${storeDir}/${item.optionalItemData.supplierLabelImage.serverFilename}.jpg`)));
            }

            return Promise.all(storeImages)
              .then(storedImages => {
                storedImages.forEach(storedImage => {
                  if (!storedImage) return;

                  if (storedImage.fieldname === 'itemLabelImage') {
                    item.optionalItemData.itemLabelImage.serverFilename = storedImage.filename;
                  }

                  if (storedImage.fieldname === 'supplierLabelImage') {
                    item.optionalItemData.supplierLabelImage.serverFilename = storedImage.filename;
                  }
                });

                return item.save();
              });
          })
          .then(updatedItem => {
            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            res.json(updatedItem);
          })
      })
      .catch(error => next(error));
  });

module.exports = imageRouter;
