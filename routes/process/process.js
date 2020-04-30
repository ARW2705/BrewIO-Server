'use strict';

const createError = require('http-errors');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const authenticate = require('../authenticate');
const isUserAuthedForRecipe = require('./process-helpers/isUserAuthedForRecipe');
const Recipe = require('../models/recipe-master');
const User = require('../models/user');
const Batch = require('../models/batch');

const processRouter = express.Router();

processRouter.use(bodyParser.json());

processRouter.route('/batch')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user !== null) {
          return Batch.find({'_id': { $in: user.activeBatchList }})
            .then(activeBatchesList => {
              res.statusCode = 200;
              res.setHeader('content-type', 'application/json');
              res.json(activeBatchesList);
            })
        } else {
          return next(createError(404, 'User not found'));
        }
      })
      .catch(error => next(error));
  });

processRouter.route('/batch/:batchId')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user !== null) {
          if (user.inProgressList.findIndex(item => item.equals(req.params.batchId)) !== -1) {
            return Batch.findById(req.params.batchId)
              .then(batch => {
                res.statusCode = 200;
                res.setHeader('content-type', 'application/json');
                res.json(batch);
              });
          } else {
            return next(createError(404, 'Batch not found'));
          }
        } else {
          return next(createError(404, 'User not found'));
        }
      })
      .catch(error => next(error));
  })
  .patch(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user !== null) {
          if (user.inProgressList.findIndex(item => item.equals(req.params.batchId)) !== -1) {
            return Batch.findByIdAndUpdate(req.params.batchId, req.body, {new: true})
              .then(updatedBatch => {
                res.statusCode = 200;
                res.setHeader('content-type', 'application/json');
                res.json(updatedBatch);
              });
          } else {
            return next(createError(400, 'Batch does not belong to user'));
          }
        } else {
          return next(createError(404, 'User not found'));
        }
      })
      .catch(error => next(error));
  })
  .delete(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user !== null) {
          const toDeleteIndex = user.inProgressList.findIndex(item => item.equals(req.params.batchId));
          if (toDeleteIndex !== -1) {
            return Batch.findByIdAndDelete(req.params.batchId)
              .then(dbres => {
                if (dbres != null) {
                  user.inProgressList.splice(toDeleteIndex, 1);
                  return user.save()
                    .then(_userDBRes => {
                      res.statusCode = 200;
                      res.setHeader('content-type', 'application/json');
                      res.json(dbres);
                    });
                } else {
                  return next(createError(404, 'Batch not found'));
                }
              });
          } else {
            return next(createError(400, 'Batch does not belong to user'));
          }
        } else {
          return next(createError(404, 'User not found'));
        }
      })
      .catch(error => next(error));
  });

processRouter.route('/batch/:batchId/step/:stepId')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user !== null) {
          if (user.inProgressList.findIndex(item => item.equals(req.params.batchId)) !== -1) {
            return Batch.findById(req.params.batchId)
              .then(batch => {
                if (batch !== null) {
                  const step = batch.schedule.find(_step => _step.equals(req.params.stepId));
                  if (step !== undefined) {
                    res.statusCode = 200;
                    res.setHeader('content-type', 'application/json');
                    res.json(step);
                  } else {
                    return next(createError(404, 'Step not found'));
                  }
                } else {
                  return next(createError(404, 'Batch not found'));
                }
              });
          } else {
            return next(createError(400, 'Batch does not belong to user'));
          }
        } else {
          return next(createError(404, 'User not found'));
        }
      })
      .catch(error => next(error))
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
        const err = new Error('Recipe not found');
        err.status = 404;
        return next(err);
      }

      // Requesting user can use a recipe if:
      // the recipe master is public
      // or the recipe master is friends only and the requesting user
      //    is in the owner user's friends list
      if (!isUserAuthedForRecipe(
        req.user.id,
        req.params.userId,
        req.params.recipeMasterId
      )) {
        const err = new Error('Recipe is private');
        err.status = 400;
        return next(err);
      }

      const recipe = recipeMaster.find(recipe => recipe.equals(req.params.recipeVariantId));
      if (recipe === undefined) {
        const err = new Error('Recipe variant not found');
        err.status = 404;
        return next(err);
      }

      return Batch.create({
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
      })
      .then(newBatch => {
        return User.findById(req.user.id)
          .then(user => {
            if (user === null) {
              const err = new Error('User not found');
              err.status = 404;
              return next(err);
            }

            user.inProgressList.push(newBatch);
            return user.save();
          })
          .then(() => {
            res.statusCode = 201;
            res.setHeader('content-type', 'application/json');
            res.json(newBatch);
          });
      })
    })
    .catch(error => next(error));
  });

// processRouter.route('/user/:userId/master/:masterRecipeId/recipe/:recipeId')
//   .get(authenticate.verifyUser, (req, res, next) => {
//     User.findById(req.params.userId)
//       .then(user => {
//         if (user !== null) {
//           return RecipeMaster.findOne({
//             $and: [
//               {_id: req.params.masterRecipeId},
//               {$or: [
//                 { owner: req.user.id },
//                 { isPublic: true },
//                 {
//                   $and: [
//                     { isFriendsOnly: true },
//                     { friendList: req.user.id }
//                   ]
//                 }
//               ]}
//             ]
//           })
//           .populate({
//             path: 'masterList',
//             populate: {
//               path: 'style'
//             }
//           })
//           .populate({
//             path: 'masterList',
//             populate: {
//               path: 'recipes',
//               populate: {
//                 path: 'grains.grainType'
//               }
//             }
//           })
//           .populate({
//             path: 'masterList',
//             populate: {
//               path: 'recipes',
//               populate: {
//                 path: 'hops.hopsType'
//               }
//             }
//           })
//           .populate({
//             path: 'masterList',
//             populate: {
//               path: 'recipes',
//               populate: {
//                 path: 'yeast.yeastType'
//               }
//             }
//           })
//           .then(master => {
//             if (master !== null) {
//               const recipeId = master.recipes.find(recipe => recipe.equals(req.params.recipeId));
//               if (recipeId !== undefined) {
//                 return Recipe.findById(recipeId)
//                   .then(recipe => {
//                     if (recipe !== null) {
//                       return User.findById(req.user.id)
//                         .then(requestingUser => {
//                           const _newBatchData = {
//                             owner: req.user.id,
//                             recipe: recipe._id,
//                             schedule: Array.from(recipe.processSchedule, process => {
//                               const copy = {};
//                               for (const key in process) {
//                                 if (key !== '_id') {
//                                   copy[key] = process[key];
//                                 }
//                               }
//                               return copy;
//                             })
//                           };
//                           return Batch.create(_newBatchData)
//                             .then(newBatch => {
//                               requestingUser.inProgressList.push(newBatch._id);
//                               return requestingUser.save()
//                                 .then(dbres => {
//                                   res.statusCode = 200;
//                                   res.setHeader('content-type', 'application/json');
//                                   res.json(newBatch);
//                                 });
//                             });
//                         })
//                     } else {
//                       return next(createError(404, 'Recipe not found'));
//                     }
//                   })
//               } else {
//                 return next(createError(404, 'Recipe does not belong to recipe master'));
//               }
//             } else {
//               return next(createError(404, 'Recipe master not found'));
//             }
//           });
//         } else {
//           return next(createError(404, 'User not found'));
//         }
//       })
//       .catch(error => next(error))
//   });

module.exports = processRouter;
