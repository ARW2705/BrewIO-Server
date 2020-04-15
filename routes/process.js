'use strict';

const createError = require('http-errors');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const authenticate = require('../authenticate');
const RecipeMaster = require('../models/recipe-master');
const Recipe = require('../models/recipe');
const User = require('../models/user');
const InProgress = require('../models/in-progress');

const processRouter = express.Router();

processRouter.use(bodyParser.json());

processRouter.route('/in-progress')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user !== null) {
          return InProgress.find({'_id': { $in: user.inProgressList }})
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

processRouter.route('/in-progress/:batchId')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user !== null) {
          if (user.inProgressList.findIndex(item => item.equals(req.params.batchId)) !== -1) {
            return InProgress.findById(req.params.batchId)
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
            return InProgress.findByIdAndUpdate(req.params.batchId, req.body, {new: true})
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
            return InProgress.findByIdAndDelete(req.params.batchId)
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

processRouter.route('/in-progress/:batchId/step/:stepId')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user !== null) {
          if (user.inProgressList.findIndex(item => item.equals(req.params.batchId)) !== -1) {
            return InProgress.findById(req.params.batchId)
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

processRouter.route('/user/:userId/master/:masterRecipeId/recipe/:recipeId')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.params.userId)
      .then(user => {
        if (user !== null) {
          return RecipeMaster.findOne({
            $and: [
              {_id: req.params.masterRecipeId},
              {$or: [
                { owner: req.user.id },
                { isPublic: true },
                {
                  $and: [
                    { isFriendsOnly: true },
                    { friendList: req.user.id }
                  ]
                }
              ]}
            ]
          })
          .populate({
            path: 'masterList',
            populate: {
              path: 'style'
            }
          })
          .populate({
            path: 'masterList',
            populate: {
              path: 'recipes',
              populate: {
                path: 'grains.grainType'
              }
            }
          })
          .populate({
            path: 'masterList',
            populate: {
              path: 'recipes',
              populate: {
                path: 'hops.hopsType'
              }
            }
          })
          .populate({
            path: 'masterList',
            populate: {
              path: 'recipes',
              populate: {
                path: 'yeast.yeastType'
              }
            }
          })
          .then(master => {
            if (master !== null) {
              const recipeId = master.recipes.find(recipe => recipe.equals(req.params.recipeId));
              if (recipeId !== undefined) {
                return Recipe.findById(recipeId)
                  .then(recipe => {
                    if (recipe !== null) {
                      return User.findById(req.user.id)
                        .then(requestingUser => {
                          const _newInProgressData = {
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
                          };
                          return InProgress.create(_newInProgressData)
                            .then(newInProgress => {
                              requestingUser.inProgressList.push(newInProgress._id);
                              return requestingUser.save()
                                .then(dbres => {
                                  res.statusCode = 200;
                                  res.setHeader('content-type', 'application/json');
                                  res.json(newInProgress);
                                });
                            });
                        })
                    } else {
                      return next(createError(404, 'Recipe not found'));
                    }
                  })
              } else {
                return next(createError(404, 'Recipe does not belong to recipe master'));
              }
            } else {
              return next(createError(404, 'Recipe master not found'));
            }
          });
        } else {
          return next(createError(404, 'User not found'));
        }
      })
      .catch(error => next(error))
  });

module.exports = processRouter;
