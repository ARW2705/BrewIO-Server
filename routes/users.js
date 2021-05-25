'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

const User = require('../models/user');
const httpError = require('../utils/http-error');
const authenticate = require('../authenticate');
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
const imageFields = [
  { name: 'userImage', maxCount: 1 },
  { name: 'breweryLabelImage', maxCount: 1 }
];

const userRouter = express.Router();

userRouter.use(bodyParser.json());

userRouter.get('/checkJWToken', (req, res) => {
  passport.authenticate('jwt', {session: false}, (error, user, data) => {
    if (error) return next(error);
    if (!user) {
      res.statusCode = 401;
      res.setHeader('content-type', 'application/json');
      return res.json(
        {
          status: 'JWT invalid',
          success: false,
          user: null,
          error: data
        }
      );
    } else {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      return res.json(
        {
          status: 'JWT valid',
          success: true,
          user: user,
          error: null
        }
      );
    }
  })(req, res);
});

userRouter.post('/login', (req, res, next) => {
  passport.authenticate('local', (error, user, data) => {
    if (error) return next(error);
    if (!user) {
      res.statusCode = 401;
      res.setHeader('content-type', 'application/json');
      return res.json({success: false, status: 'Login Unsuccessful', error: data});
    }
    req.logIn(user, error => {
      if (error) return next(error);
      const token = authenticate.getToken({_id: req.user._id});
      return User.findById(user._id)
        .then(userProfile => {
          const _user = {
            _id: userProfile._id,
            username: userProfile.username,
            firstname: userProfile.firstname || undefined,
            lastname: userProfile.lastname || undefined,
            email: userProfile.email || undefined,
            friendList: userProfile.friendList,
            token: token,
            preferredUnitSystem: userProfile.preferredUnitSystem,
            units: userProfile.units,
            userImage: userProfile.userImage,
            breweryLabelImage: userProfile.breweryLabelImage
          };
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          return res.json({success: true, status: 'Login Successful', user: _user});
        });
    });
  })(req, res, next);
});

userRouter.post('/signup', upload.fields(imageFields), async(req, res, next) => {
  const users = await User.find({});
  if (users.length > 20) {
    res.statusCode = 423;
    res.setHeader('content-type', 'application/json');
    return res.json({success: false, status: 'Max users reached for this version: contact admin'});
  }

  const parsedDoc = JSON.parse(req.body.user);
  req.body['username'] = parsedDoc.username;
  req.body['password'] = parsedDoc.password;

  User.register(
    new User(
      {
        username: parsedDoc.username,
        email: parsedDoc.email,
        preferredUnitSystem: parsedDoc.preferredUnitSystem,
        units: parsedDoc.units
      }
    ),
    parsedDoc.password,
    (error, user) => {
      if (error) {
        res.statusCode = 500;
        res.setHeader('content-type', 'application/json');
        res.json(error);
      } else {
        if (parsedDoc.firstname) user.firstname = parsedDoc.firstname;
        if (parsedDoc.lastname) user.lastname = parsedDoc.lastname;
        if (parsedDoc.userImage) user.userImage = parsedDoc.userImage;
        if (parsedDoc.breweryLabelImage) user.breweryLabelImage = parsedDoc.breweryLabelImage;

        const storeImages = [];

        if (req.files.userImage && req.files.userImage.length && req.files.userImage[0].cid !== '0') {
          storeImages.push(imageFileHandler.storeImage(req.files.userImage[0]));
        }

        if (req.files.breweryLabelImage && req.files.breweryLabelImage.length && req.files.breweryLabelImage[0].cid !== '0') {
          storeImages.push(imageFileHandler.storeImage(req.files.breweryLabelImage[0]));
        }

        Promise.all(storeImages)
          .then(storedImages => {
            storedImages.forEach(storedImage => {
              let fieldname = 'userImage';
              if (storedImage.fieldname === fieldname) {
                user[fieldname].serverFilename = storedImage.filename;
                user[fieldname].hasPending = false;
              }

              fieldname = 'breweryLabelImage';
              if (storedImage.fieldname === fieldname) {
                user[fieldname].serverFilename = storedImage.filename;
                user[fieldname].hasPending = false;
              }
            });

            user.save((error, user) => {
              if (error) {
                res.statusCode = 500;
                res.setHeader('content-type', 'application/json');
                res.json({error: error});
                return;
              }
              passport.authenticate('local')(req, res, () => {
                res.statusCode = 200;
                res.setHeader('content-type', 'application/json');
                res.json({success: true, status: 'Registration successful'});
              });
            });
          })
          .catch(next);
      }
    });
});

userRouter.route('/profile')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user !== null) {

          const response = {
            _id: user._id,
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            preferredUnitSystem: user.preferredUnitSystem,
            units: user.units,
            userImage: user.userImage,
            breweryLabelImage: user.breweryLabelImage
          };
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(response);
        } else {
          throw httpError(404, 'User not found');
        }
      })
      .catch(error => next(error));
  })
  .patch(authenticate.verifyUser, upload.fields(imageFields), (req, res, next) => {
    const parsedDoc = JSON.parse(req.body.user);

    User.findByIdAndUpdate(req.user.id, { $set: parsedDoc }, { new: true })
      .then(updated => {
        const storeImages = [];

        if (req.files.userImage && req.files.userImage.length && req.files.userImage[0].cid !== '0') {
          storeImages.push(imageFileHandler.storeImage(req.files.userImage[0]));
        }

        if (req.files.breweryLabelImage && req.files.breweryLabelImage.length && req.files.breweryLabelImage[0].cid !== '0') {
          storeImages.push(imageFileHandler.storeImage(req.files.breweryLabelImage[0]));
        }

        return Promise.all(storeImages)
          .then(storedImages => {
            const deleteImages = [];

            storedImages.forEach(storedImage => {
              let fieldname = 'userImage';

              if (storedImage.fieldname === fieldname) {
                deleteImages.push(
                  imageFileHandler.deleteImage(updated[fieldname].serverFilename)
                );

                updated[fieldname].serverFilename = storedImage.filename;
                updated[fieldname].hasPending = false;
              }

              fieldname = 'breweryLabelImage';
              if (storedImage.fieldname === fieldname) {
                deleteImages.push(
                  imageFileHandler.deleteImage(updated[fieldname].serverFilename)
                );
                updated[fieldname].serverFilename = storedImage.filename;
                updated[fieldname].hasPending = false;
              }
            });

            return Promise.all([ updated.save(), ...deleteImages ]);
          });
      })
      .then(results => {
        const completedUser = results[0];
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(completedUser);
      })
      .catch(next);
  });

module.exports = userRouter;
