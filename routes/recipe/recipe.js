'use strict';

const httpError = require('../../utils/http-error');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const authenticate = require('../../authenticate');
const populationPaths = require('./recipe-helpers').populationPaths;
const meetsMinimumVariantCount = require('./recipe-helpers').meetsMinimumVariantCount;
const Recipe = require('../../models/recipe-master');
const User = require('../../models/user');
const imageFileHandler = require('../images/image-helpers');
const upload = multer(
  {
    dest: 'brew-io-uploads/tmp/',
    fileFilter: (req, file, cb) => {
      cb(null, file.originalname !== '0.jpg');
    },
    limits: {
      fileSize: 500 * 1024, // 500 kB
      files: 1
    }
  }
);
const storeDir = '../../../brew-io-uploads/images';

const recipeRouter = express.Router();

recipeRouter.use(bodyParser.json());

/* Public Accessible */

// GET requests only for recipes that are marked as public

recipeRouter.route('/public/:userId')
  .get((req, res, next) => {
    User.findById(req.params.userId)
      .then(user => {
        if (user === null) {
          throw httpError(404, 'User not found');
        }
        return Recipe.find({ _id: { $in: user.masterList } })
          .populate('style')
          .populate('variants.grains.grainType')
          .populate('variants.hops.hopsType')
          .populate('variants.yeast.yeastType');
      })
      .then(masterList => {
        const forResponse = masterList
          .filter(master => {
            return master.isPublic;
          })
          .map(master => {
            if (master.hasOwnProperty('recipeImage')) {
              master.recipeImage.filePath = '';
            }
            return master;
          });
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(forResponse);
      })
      .catch(next);
  });

recipeRouter.route('/public/master/:recipeMasterId')
  .get((req, res, next) => {
    Recipe.findById(req.params.recipeMasterId)
      .then(recipeMaster => {
        if (recipeMaster === null) {
          throw httpError(404, `Recipe with id: "${req.params.recipeMasterId}" not found`);
        }

        if (!recipeMaster.isPublic) {
          res.statusCode = 200;
          res.setHeader('content-type', 'applications/json');
          res.json({
            status: 'nok',
            message: `Recipe with id: "${req.params.recipeMasterId}" is private`
          });
        }

        return Recipe.populate(
          recipeMaster,
          populationPaths
        );
      })
      .then(forResponse => {
        if (forResponse.hasOwnProperty('recipeImage')) {
          forResponse.recipeImage.filePath = '';
        }
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(forResponse);
      })
      .catch(next);
  });

recipeRouter.route('/public/master/:recipeMasterId/author')
  .get((req, res, next) => {
    Recipe.findById(req.params.recipeMasterId)
      .then(recipeMaster => {
        if (recipeMaster === null) {
          throw httpError(404, `Recipe with id: "${req.params.recipeMasterId}" not found`);
        }

        return User.findById(recipeMaster.owner)
      })
      .then(user => {
        if (user === null) {
          throw httpError(404, `Owner of recipe master not found`);
        }

        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json({
          username: user.username,
          userImage: user.userImage,
          breweryLabelImage: user.breweryLabelImage
        });
      })
      .catch(next);
  });

recipeRouter.route('/public/master/:recipeMasterId/variant/:recipeVariantId')
  .get((req, res, next) => {
    Recipe.findById(req.params.recipeMasterId)
      .then(recipeMaster => {
        if (recipeMaster === null) {
          throw httpError(404, `Recipe with id: "${req.params.recipeMasterId}" not found`);
        }

        if (!recipeMaster.isPublic) {
          res.statusCode = 200;
          res.setHeader('content-type', 'applications/json');
          res.json({
            status: 'nok',
            message: `Recipe with id: "${req.params.recipeMasterId}" is private`
          });
        }

        const variant = recipeMaster.variants.find(_variant => _variant.equals(req.params.recipeVariantId));
        if (variant === undefined) {
          throw httpError(404, `Recipe variant with id: "${req.params.recipeVariantId}" not found`)
        }

        return Recipe.populate(
          variant,
          variantPopulationPaths
        );
      })
      .then(forResponse => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(forResponse);
      })
      .catch(next);
  });

/* End Public Accessible */


/* Private Accessible */

// CRUD Operations only performed by User owned docs

recipeRouter.route('/private')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user === null) {
          throw httpError(404, 'User not found');
        }

        return Recipe.find({ _id: { $in: user.masterList } })
          .populate('style')
          .populate('variants.grains.grainType')
          .populate('variants.hops.hopsType')
          .populate('variants.yeast.yeastType');
      })
      .then(masterList => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(masterList);
      })
      .catch(next);
  })
  .post(authenticate.verifyUser, upload.single('labelImage'), (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user === null) {
          throw httpError(404, 'User not found');
        }

        const parsedDoc = JSON.parse(req.body.recipeMaster);

        if (parsedDoc.variants.length === 0) {
          throw httpError(400, 'Requires at least one recipe');
        }

        let recipeMasterIndex = parsedDoc.variants
          .findIndex(variant => {
            return variant.cid === parsedDoc.master
          });
        recipeMasterIndex = recipeMasterIndex === -1 ? 0: recipeMasterIndex;
        parsedDoc.owner = user._id;

        return Recipe.create(parsedDoc)
          .then(newRecipeMaster => {
            newRecipeMaster.master = newRecipeMaster.variants[recipeMasterIndex].cid;
            newRecipeMaster.variants[recipeMasterIndex].isMaster = true;

            let storeImage;
            if (req.file) {
              storeImage = imageFileHandler.storeImage(req.file);
            } else {
              storeImage = Promise.resolve(null);
            }

            return storeImage
              .then(storedImage => {
                if (storedImage) {
                  newRecipeMaster.labelImage.serverFilename = storedImage.filename;
                  newRecipeMaster.labelImage.hasPending = false;
                }

                return newRecipeMaster.save()
              })
              .then(updatedRecipeMaster => {
                user.masterList.push(updatedRecipeMaster);
                return user.save()
                  .then(() => {
                    return Recipe.populate(
                      updatedRecipeMaster,
                      populationPaths
                    );
                  });
              });
          });
      })
      .then(forResponse => {
        res.statusCode = 201;
        res.setHeader('content-type', 'application/json');
        res.json(forResponse);
      })
      .catch(next);
  });

recipeRouter.route('/private/master/:recipeMasterId')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user === null) {
          throw httpError(404, 'User not found');
        }

        if (!user.masterList.some(recipe => recipe.equals(req.params.recipeMasterId))) {
          throw httpError(404, `Recipe with id: ${req.params.recipeMasterId} not found or does not belong to User`);
        }

        return Recipe.findById(req.params.recipeMasterId)
          .populate('style')
          .populate('variants.grains.grainType')
          .populate('variants.hops.hopsType')
          .populate('variants.yeast.yeastType');
      })
      .then(recipeMaster => {
        if (recipeMaster === null) {
          throw httpError(404, `Recipe with id: "${req.params.recipeMasterId}" not found`);
        }

        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(recipeMaster);
      })
      .catch(next);
  })
  .post(authenticate.verifyUser, upload.none(), (req, res, next) => {
    User.findOne({
      _id: req.user.id,
      masterList: req.params.recipeMasterId
    })
    .then(user => {
      if (user === null) {
        throw httpError(404, 'User not found');
      }

      if (!user.masterList.some(recipe => recipe.equals(req.params.recipeMasterId))) {
        throw httpError(404, `Recipe with id: ${req.params.recipeMasterId} not found or does not belong to User`);
      }

      return Recipe.findById(req.params.recipeMasterId)
        .then(recipeMaster => {
          if (recipeMaster === null) {
            throw httpError(404, `Recipe with id: ${req.params.recipeMasterId} not found`);
          }

          const newRecipeVariant = JSON.parse(req.body.recipeVariant);
          newRecipeVariant._id = mongoose.Types.ObjectId();

          if (newRecipeVariant.isMaster) {
            const oldMaster = recipeMaster.variants.find(variant => variant.isMaster);
            oldMaster.isMaster = false;
            recipeMaster.master = newRecipeVariant.cid;
          }
          recipeMaster.variants.push(newRecipeVariant);

          return recipeMaster.save()
            .then(() => {
              return Recipe.populate(
                recipeMaster,
                populationPaths
              )
            })
            .then(forResponse => {
              res.status = 201;
              res.setHeader('content-type', 'application/json');
              res.json(forResponse.variants[forResponse.variants.length - 1]);
            });
        });
    })
    .catch(next);
  })
  .patch(authenticate.verifyUser, upload.single('labelImage'), (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user === null) {
          throw httpError(404, 'User not found');
        }

        if (!user.masterList.some(recipe => recipe.equals(req.params.recipeMasterId))) {
          throw httpError(404, `Recipe with id: ${req.params.recipeMasterId} not found or does not belong to User`);
        }

        const parsedDoc = JSON.parse(req.body.recipeMaster);

        return Recipe.findByIdAndUpdate(
          req.params.recipeMasterId,
          { $set: parsedDoc },
          { new: true }
        );
      })
      .then(preImageStoreRecipeMaster => {
        let storeImage;
        let previousImageFilename;
        if (req.file) {
          previousImageFilename = preImageStoreRecipeMaster.labelImage.serverFilename;
          storeImage = imageFileHandler.storeImage(req.file);
        } else {
          storeImage = Promise.resolve(null);
        }

        return storeImage
          .then(storedImage => {
            if (storedImage) {
              preImageStoreRecipeMaster.labelImage.serverFilename = storedImage.filename;
              preImageStoreRecipeMaster.labelImage.hasPending = false;
              return imageFileHandler.deleteImage(previousImageFilename);
            }
            return Promise.resolve(null);
          })
          .then(() => preImageStoreRecipeMaster.save())
          .then(postImageStoreRecipeMaster => {
            return Recipe.populate(
              postImageStoreRecipeMaster,
              populationPaths
            );
          });
      })
      .then(recipeMaster => {
        if (recipeMaster === null) {
          throw httpError(404, `Recipe with id: "${req.params.recipeMasterId}" not found`);
        }

        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(recipeMaster);
      })
      .catch(next);
  })
  .delete(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user === null) {
          throw httpError(404, 'User not found');
        }

        if (!user.masterList.some(master => master.equals(req.params.recipeMasterId))) {
          throw httpError(400, 'Recipe does not belong to user');
        }

        return Recipe.findByIdAndDelete(req.params.recipeMasterId)
          .then(recipeDBRes => {
            if (recipeDBRes === null) {
              throw httpError(404, 'Recipe not found');
            }

            user.masterList.pull(req.params.recipeMasterId)
            return user.save()
              .then(() => {
                res.statusCode = 200;
                res.setHeader('content-type', 'application/json');
                res.json(recipeDBRes);
              });
          });
      })
      .catch(next);
  });

recipeRouter.route('/private/master/:recipeMasterId/variant/:recipeVariantId')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user === null) {
          throw httpError(404, 'User not found');
        }

        if (!user.masterList.some(_recipeMaster => _recipeMaster.equals(req.params.recipeMasterId))) {
          throw httpError(400, `Recipe with id: ${req.params.recipeMasterId} does not belong to User`);
        }

        return Recipe.findById(req.params.recipeMasterId)
          .populate('variants.grains.grainType')
          .populate('variants.hops.hopsType')
          .populate('variants.yeast.yeastType')
          .then(recipeMaster => {
            if (recipeMaster === null) {
              throw httpError(404, `Recipe with id: ${req.params.recipeMasterId} not found`);
            }

            const variant = recipeMaster.variants.find(_variant => _variant.equals(req.params.recipeVariantId));
            if (variant === undefined) {
              throw httpError(404, `Recipe variant with id: ${req.params.recipeVariantId} not found`);
            }

            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            res.json(variant);
          });

      })
      .catch(next);
  })
  .patch(authenticate.verifyUser, upload.none(), (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user === null) {
          throw httpError(404, 'User not found');
        }

        if (!user.masterList.some(_recipeMaster => _recipeMaster.equals(req.params.recipeMasterId))) {
          throw httpError(400, `Recipe with id: ${req.params.recipeMasterId} does not belong to User`);
        }

        return Recipe.findById(req.params.recipeMasterId)
          .then(recipeMaster => {
            if (recipeMaster === null) {
              throw httpError(404, `Recipe with id: ${req.params.recipeMasterId} not found`);
            }

            const variant = recipeMaster.variants.find(_variant => _variant.equals(req.params.recipeVariantId));
            if (variant === undefined) {
              throw httpError(404, `Recipe variant with id: ${req.params.recipeVariantId} not found`);
            }

            const update = JSON.parse(req.body.recipeVariant);

            if (meetsMinimumVariantCount(update, recipeMaster)) {
              throw httpError(
                400,
                'Recipe must contain at least one variant set to master'
              );
            } else if (update.isMaster !== undefined && !update.isMaster) {
              if (recipeMaster.variants[0].equals(req.params.recipeVariantId)) {
                update.isMaster = true;
              } else {
                recipeMaster.variants[0].isMaster = true;
              }
            } else if (recipeMaster.variants.length > 1 && update.isMaster) {
              let oldMaster = recipeMaster.variants
                .find(_oldMasterVariant => _oldMasterVariant.isMaster);
              if (oldMaster === undefined) oldMaster = recipeMaster.variants[0];
              oldMaster.isMaster = false;
              recipeMaster.master = variant.cid;
            }

            variant.set(update);
            return recipeMaster.save()
              .then(() => {
                return Recipe.populate(
                  recipeMaster,
                  populationPaths
                );
              })
              .then(forResponse => {
                const updatedVariant = recipeMaster.variants
                  .find(_variant => _variant.equals(req.params.recipeVariantId));
                res.statusCode = 200;
                res.setHeader('content-type', 'application/json');
                res.json(updatedVariant);
              });
        });
      })
      .catch(next);
  })
  .delete(authenticate.verifyUser, (req, res, next) => {
    User.find({_id: req.user.id, masterList: req.params.recipeMasterId})
      .then(_user => {
        if (_user === null || _user.length === 0) {
          throw httpError(404, 'User not found');
        }

        const user = _user[0];
        if (!user.masterList.some(_recipeMaster => _recipeMaster.equals(req.params.recipeMasterId))) {
          throw httpError(400, 'Recipe does not belong to user');
        }

        return Recipe.findById(req.params.recipeMasterId);
      })
      .then(recipeMaster => {
        const variantIndex = recipeMaster.variants.findIndex(_variant => _variant.equals(req.params.recipeVariantId));
        if (variantIndex === -1) {
          throw httpError(404, 'Recipe variant not found');
        }

        // At least one variant must remain
        // if deleting the master variant, set the first available variant as the new master
        // must have at least 2 variants present to perform a delete
        if (recipeMaster.variants[variantIndex].isMaster) {
          if (recipeMaster.variants.length < 2) {
            throw httpError(400, 'At least one variant is required to be stored: deletion cannot be performed');
          }

          const newMaster = recipeMaster.variants[variantIndex === 0 ? 1: 0];
          newMaster.isMaster = true;
          recipeMaster.master = newMaster.cid;
        }

        recipeMaster.variants.splice(variantIndex, 1);
        return recipeMaster.save();
      })
      .then(dbres => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(dbres);
      })
      .catch(next);
  });

module.exports = recipeRouter;
