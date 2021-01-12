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
const upload = multer(
  {
    dest: 'user-images/tmp/',
    limits: {
      fileSize: 500 * 1024, // 500 kB
      files: 1
    }
  }
);

/* router setup */
const imageRouter = express.Router();


imageRouter.route('/upload/inventory/:imageId')
  .post(authenticate.verifyUser, upload.single('label-image'), (req, res, next) => {
    console.log(req);
    const tmpPath = req.file.path;
    const targetPath = path.join(__dirname, './user-images/', req.params.imageId, '.jpg');

    console.log(tmpPath, targetPath);

    if (path.extname(req.file.originalName).toLowerCase() === '.jpg') {
      fs.rename(tmpPath, targetPath, (error) => {
        if (error) {
          console.log('Image migration error', error);
          throw httpError(500, 'Oops! Something went wrong');
        }
        res.status(200).end();
      })
    } else {
      fs.unlink(tmpPath, (error) => {
        if (error) {
          console.log('Image file removal error', error);
          throw httpError(500, 'Oops! Something went wrong');
        }
        throw httpError(403, 'Invalid file type');
      })
    }
  });

module.exports = imageRouter;
