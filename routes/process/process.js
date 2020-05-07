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

        return Batch.find({ _id: { $in: user.activeBatchList } })
          .then(activeBatchList => {
            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            res.json(activeBatchList);
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

        if (!user.activeBatchList.some(item => item.equals(req.params.batchId))) {
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

        const toDeleteIndex = user.activeBatchList.findIndex(item => item.equals(req.params.batchId));

        if (toDeleteIndex === -1) {
          throw httpError(400, 'Batch does not belong to user');
        }

        return Batch.findByIdAndDelete(req.params.batchId)
          .then(dbres => {
            if (dbres === null) {
              throw httpError(404, 'Batch not found');
            }

            user.activeBatchList.splice(toDeleteIndex, 1);
            return user.save()
              .then(_userDBRes => {
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
          throw throwError(404, 'User not found');
        }

        if (user.activeBatchList.findIndex(item => item.equals(req.params.batchId)) === -1) {
          throw throwError(400, 'Batch does not belong to user');
        }

        return Batch.findById(req.params.batchId)
          .then(batch => {
            const step = batch.schedule.find(_step => _step.equals(req.params.stepId));
            if (step === undefined) {
              throw throwError(404, 'Step not found');
            }

            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            res.json(step);
          });
      })
      .catch(next)
  });

processRouter.route('/user/:userId/master/:recipeMasterId/variant/:recipeVariantId')
  .get(authenticate.verifyUser, (req, res, next) => {
    Recipe.findOne({
      $and: [
        { _id: req.params.recipeMasterId },
        { owner: req.params.userId }
      ]
    })
    .then(recipeMaster => {

      if (recipeMaster === null) {
        throw throwError(404, 'Recipe not found');
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
        throw throwError(400, 'Recipe is private');
      }

      const recipe = recipeMaster.variants.find(variant => variant.equals(req.params.recipeVariantId));
      if (recipe === undefined) {
        throw throwError(404, 'Recipe variant not found');
      }

      return Batch.create(
        {
          owner: req.user.id,
          recipe: recipe._id,
          schedule: Array.from(recipe.processSchedule, process => {
              const copy = {};
              for (const key in process) {
                if (key !== '_id') {
                  copy[key] = process[key];
                }
              }
              return copy;
          })
        }
      )
      .then(newBatch => {
        return User.findById(req.user.id)
          .then(user => {
            if (user === null) {
              throw throwError(404, 'User not found');
            }

            user.activeBatchList.push(newBatch);
            return user.save();
          })
          .then(() => {
            res.statusCode = 201;
            res.setHeader('content-type', 'application/json');
            res.json(newBatch);
          });
      })
    })
    .catch(next);
  });

module.exports = processRouter;
