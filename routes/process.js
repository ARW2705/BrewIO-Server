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

processRouter.route('in-progress/:batchId')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        const batch = user.inProgressList.find(item => item.equals(req.params.batchId));
        if (batch) {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(batch);
        } else {
          const err = new Error(`Batch with id ${req.params.batchId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch(error => next(error));
  })
  .patch(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        const batch = user.inProgressList.find(item => item.equals(req.params.batchId));
        if (batch) {
          batch.currentStep = req.body.currentStep;
          return user.save()
            .then(() => {
              res.statusCode = 200;
              res.setHeader('content-type', 'application/json');
              res.json({})
            });
        } else {
          const err = new Error(`Batch with id ${req.params.batchId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch(error => next(error));
  })
  .delete(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        const toDeleteIndex = user.inProgressList.findIndex(item => item.equals(req.params.batchId));
        if (toDeleteIndex != -1) {
          user.inProgressList.splice(toDeleteIndex, 1);
          return user.save()
            .then(() => {
              res.statusCode = 200;
              res.setHeader('content-type', 'application/json');
              res.json({success: true});
            });
        } else {
          const err = new Error(`Batch with id ${req.params.batchId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch(error => next(error));
  });

processRouter.route('batch/:batchId/step/:stepId')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        const batch = user.inProgressList.find(item => item.equals(req.params.batchId));
        if (batch) {
          const step = batch.schedule.find(item => item.equals(req.params.stepId));
          if (step) {
            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            res.json(step);
          } else {
            const err = new Error(`Step with id ${req.params.stepId} not found`);
            err.status = 404;
            return err;
          }
        } else {
          const err = new Error(`Batch with id ${req.params.batchId} not found`);
          err.status = 404;
          return err;
        }
      })
      .catch(error => next(error))
  })
  .patch(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        const batch = user.inProgressList.find(item => item.equals(req.params.batchId));
        if (batch) {
          const stepIndex = batch.schedule.findIndex(item => item.equals(req.params.stepId));
          if (stepIndex != -1) {
            batch[stepIndex] = req.body;
            return user.save()
              .then(dbres => {
                res.statusCode = 200;
                res.setHeader('content-type', 'application/json');
                res.json(dbres);
              });
          } else {
            const err = new Error(`Step with id ${req.params.stepId} not found`);
            err.status = 404;
            return err;
          }
        } else {
          const err = new Error(`Batch with id ${req.params.batchId} not found`);
          err.status = 404;
          return err;
        }
      })
      .catch(error => next(error))
  });

processRouter.route('batch/:batchId/next')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        const batch = user.inProgressList.find(item => item.equals(req.params.batchId));
        if (batch) {
          batch.currentStep++;
          user.save()
            .then(dbres => {
              res.statusCode = 200;
              res.setHeader('content-type', 'application/json');
              res.json(dbres);
            });
        } else {
          const err = new Error(`Batch with id ${req.params.batchId} not found`);
          err.status = 404;
          return err;
        }
      })
      .catch(error => next(error))
  });

processRouter.route('user/:userId/master/:masterRecipeId/recipe/:recipeId')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.params.userId)
      .then(user => {
        if (user) {
          return RecipeMaster.findOne({
            _id: req.params.masterRecipeId,
            $or: [
              { isPublic: true },
              {
                $and: [
                  { isFriendsOnly: true },
                  { friendList: req.user.id }
                ]
              }
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
            if (master) {
              const _recipe = master.recipes.find(item => item.equals(req.params.recipeId));
              return Recipe.findById(_recipe)
                .then(recipe => {
                  if (recipe) {
                    return InProgress.create({
                      recipe: recipe._id,
                      schedule: Array.from(recipe.processSchedule, process => {
                        const copy = {};
                        for (const key in process) {
                          if (key != '_id') {
                            copy[key] = process[key];
                          }
                        }
                        return copy;
                      })
                    })
                      .then(startedBatch => {
                        return User.findById(req.user.id)
                          .then(requestingUser => {
                            requestingUser.inProgressList.push(startedBatch);
                            return requestingUser.save()
                              .then(() => {
                                res.statusCode = 200;
                                res.setHeader('content-type', 'application/json');
                                res.json(startedBatch);
                              })
                          })
                      })
                  } else {
                    const err = new Error(`Recipe with id: "${req.params.recipeId}" not found`);
                    err.status = 404;
                    return next(err);
                  }
                })
            } else {
              const err = new Error(`Recipe master with id: "${req.params.masterRecipeId}" not found`);
              err.status = 404;
              return next(err);
            }
          })
        } else {
          const err = new Error(`User with id: "${req.params.userId}" not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch(error => next(error))
  });

// processRouter.route('/master/:masterRecipeId/recipe/:recipeId')
//   .get(authenticate.verifyUser, (req, res, next) => {
//     User.findOne({_id: req.user.id, masterList: req.params.masterRecipeId})
//       .then(user => {
//         return RecipeMaster.findById(req.params.masterRecipeId)
//           .then(master => {
//             if (master) {
//               const recipe = master.recipes.find(item => item.equals(req.params.recipeId));
//               return Recipe.findById(recipe)
//                 .then(recipe => {
//                   if (recipe) {
//                     res.statusCode = 200;
//                     res.setHeader('content-type', 'application/json');
//                     res.json(recipe.processSchedule);
//                   } else {
//                     const err = new Error(`Batch with id: "${req.params.recipeId}" not found`);
//                     err.status = 404;
//                     return next(err);
//                   }
//                 });
//             } else {
//               const err = new Error(`Recipe with id: "${req.params.masterRecipeId}" not found`);
//               err.status = 404;
//               return next(err);
//             }
//           });
//       })
//       .catch(err => next(err));
//   });
//
// processRouter.route('/master/:masterRecipeId/recipe/:recipeId/step/:stepId')
//   .get(authenticate.verifyUser, (req, res, next) => {
//     User.findOne({_id: req.user.id, masterList: req.params.masterRecipeId})
//       .then(user => {
//         return RecipeMaster.findById(req.params.masterRecipeId)
//           .then(master => {
//             if (master) {
//               const _recipe = master.recipes.find(item => item.equals(req.params.recipeId));
//               return Recipe.findById(_recipe)
//                 .then(recipe => {
//                   if (recipe) {
//                     const step = recipe.processSchedule.find(step => step.equals(req.params.stepId));
//                     if (step) {
//                       res.statusCode = 200;
//                       res.setHeader('content-type', 'application/json');
//                       res.json(step);
//                     } else {
//                       const err = new Error(`Step with id: "${req.params.stepId}" not found`);
//                       err.status = 404;
//                       return next(err);
//                     }
//                   } else {
//                     const err = new Error(`Recipe with id: "${req.params.recipeId}" not found`);
//                     err.status = 404;
//                     return next(err);
//                   }
//                 });
//             } else {
//               const err = new Error(`Master with id: "${req.params.masterRecipeId}" not found`);
//               err.status = 404;
//               return next(err);
//             }
//           });
//       })
//       .catch(err => next(err));
//   })
//   .patch(authenticate.verifyUser, (req, res, next) => {
//     User.findOne({_id: req.user.id, masterList: req.params.masterRecipeId})
//       .then(user => {
//         return RecipeMaster.findById(req.params.masterRecipeId)
//           .then(master => {
//             if (master) {
//               const _recipe = master.recipes.find(item => item.equals(req.params.recipeId));
//               return Recipe.findById(_recipe)
//                 .then(recipe => {
//                   if (recipe) {
//                     const updateIndex = recipe.processSchedule.findIndex(step => step.equals(req.params.stepId));
//                     for (const key in req.body) {
//                       recipe.processSchedule[updateIndex][key] = req.body[key];
//                     }
//                     return recipe.save()
//                       .then(dbres => {
//                         res.statusCode = 200;
//                         res.setHeader('content-type', 'application/json');
//                         res.json(dbres.processSchedule[updateIndex]);
//                       });
//                   } else {
//                     const err = new Error(`Batch with id: "${req.params.recipeId}" not found`);
//                     err.status = 404;
//                     return next(err);
//                   }
//                 });
//             } else {
//               const err = new Error(`Recipe with id: "${req.params.masterRecipeId}" not found`);
//               err.status = 404;
//               return next(err);
//             }
//           });
//       })
//       .catch(err => next(err));
//   });

module.exports = processRouter;
