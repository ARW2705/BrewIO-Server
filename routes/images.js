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
// const imageFileHandler = require('../utils/image-file-handler');
const upload = multer(
  {
    dest: 'brew-io-uploads/tmp/',
    limits: {
      // fileSize: 500 * 1024, // 500 kB
      files: 1
    }
  }
);
const storeDir = '../../brew-io-uploads/images';
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
    console.log('file', req.file);
    console.log('files', req.files);

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

            // imageFileHandler.storeImage(req.file)
            //   .then(storageResult => {
            //
            //   })

            res.status(200).end();
          })
      })
      .catch(error => next(error));



    // console.log(req.file, tmpPath, targetPath);
    //
    // if (path.extname(req.file.originalname).toLowerCase() === '.jpg') {
    //   fs.rename(tmpPath, targetPath, (error) => {
    //     if (error) {
    //       console.log('Image migration error', error);
    //       throw httpError(500, 'Oops! Something went wrong');
    //     }
    //
    //     res.status(200).end();
    //   });
    // } else {
    //   fs.unlink(tmpPath, (error) => {
    //     if (error) {
    //       console.log('Image file removal error', error);
    //     }
    //
    //     throw httpError(403, 'Invalid file type');
    //   });
    // }
  });

module.exports = imageRouter;
