'use strict';

const httpError = require('../../utils/http-error');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const authenticate = require('../../authenticate');
const isUserAuthedForRecipe = require('./process-helpers').isUserAuthedForRecipe;
const Recipe = require('../../models/recipe-master');
const User = require('../../models/user');
const Batch = require('../../models/batch');

const processRouter = express.Router();

processRouter.use(bodyParser.json());

processRouter.route('/batch')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user === null) {
          throw httpError(404, 'User not found');
        }

        return Batch.find({
          _id: { $in: user.batchList }
        })
        .then(batchList => {
          const activeBatches = [];
          const archiveBatches = [];

          batchList.forEach(batch => {
            if (batch.isArchived) {
              archiveBatches.push(batch);
            } else {
              activeBatches.push(batch);
            }
          });

          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(
            {
              activeBatches: activeBatches,
              archiveBatches: archiveBatches
            }
          );
        });
      })
      .catch(next);
  })
  .post(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user === null) {
          throw httpError(404, 'User not found');
        }

        if (req.body.owner === 'offline') {
          req.body.owner = user._id;
        }

        return Batch.create(req.body)
          .then(newBatch => {
            user.batchList.push(newBatch);
            return user.save()
              .then(() => {
                res.statusCode = 201;
                res.setHeader('content-type', 'application/json');
                res.json(newBatch);
              });
          });
      })
      .catch(next);
  });

processRouter.route('/batch/:batchId')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user === null) {
          throw httpError(404, 'User not found');
        }

        return Batch.findById(req.params.batchId)
          .then(batch => {
            if (batch === null) {
              throw httpError(404, 'Batch not found');
            }

            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            res.json(batch);
          });
      })
      .catch(next);
  })
  .patch(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user === null) {
          throw httpError(404, 'User not found');
        }

        if (!user.batchList.some(item => item.equals(req.params.batchId))) {
          throw httpError(400, 'Batch does not belong to user');
        }

        return Batch.findByIdAndUpdate(
            req.params.batchId,
            req.body,
            { new: true }
          )
          .then(updatedBatch => {
            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            res.json(updatedBatch);
          });
      })
      .catch(next);
  })
  .delete(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user === null) {
          throw httpError(404, 'User not found');
        }

        if (!user.batchList.some(batch => batch.equals(req.params.batchId))) {
          throw httpError(400, 'Batch does not belong to user');
        }

        return Batch.findByIdAndDelete(req.params.batchId)
          .then(dbres => {
            if (dbres === null) {
              throw httpError(404, 'Batch not found');
            }

            user.batchList.pull(req.params.batchId);
            return user.save()
              .then(() => {
                res.statusCode = 200;
                res.setHeader('content-type', 'application/json');
                res.json(dbres);
              });
          });
      })
      .catch(next);
  });

processRouter.route('/batch/:batchId/step/:stepId')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user === null) {
          throw httpError(404, 'User not found');
        }

        if (user.batchList.findIndex(item => item.equals(req.params.batchId)) === -1) {
          throw httpError(400, 'Batch does not belong to user');
        }

        return Batch.findById(req.params.batchId)
          .then(batch => {
            const step = batch.process.schedule.find(_step => _step.equals(req.params.stepId));
            if (step === undefined) {
              throw httpError(404, 'Step not found');
            }

            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            res.json(step);
          });
      })
      .catch(next);
  });

processRouter.route('/user/:userId/master/:recipeMasterId/variant/:recipeVariantId')
  .post(authenticate.verifyUser, (req, res, next) => {
    Recipe.findOne({
      $and: [
        { _id: req.params.recipeMasterId },
        { owner: req.params.userId }
      ]
    })
    .then(recipeMaster => {

      if (recipeMaster === null) {
        throw httpError(404, 'Recipe not found');
      }

      // Requesting user can use a recipe if:
      // the recipe master is public
      // or the recipe master is friends only and the requesting user
      //    is in the owner user's friends list
      if (!isUserAuthedForRecipe
        (
          req.user.id,
          req.params.userId,
          req.params.recipeMasterId
        )
      ) {
        throw httpError(400, 'Recipe is private');
      }

      const recipe = recipeMaster.variants.find(variant => {
        return variant.equals(req.params.recipeVariantId)
      });

      if (recipe === undefined) {
        throw httpError(404, 'Recipe variant not found');
      }

      return Batch.create(req.body)
        .then(newBatch => {
          return User.findById(req.user.id)
            .then(user => {
              if (user === null) {
                throw httpError(404, 'User not found');
              }

              user.batchList.push(newBatch);
              return user.save();
            })
            .then(() => {
              res.statusCode = 201;
              res.setHeader('content-type', 'application/json');
              res.json(newBatch);
            });
        });
    })
    .catch(next);
  });

module.exports = processRouter;
