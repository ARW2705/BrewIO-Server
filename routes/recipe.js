'use strict';

const createError = require('http-errors');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const authenticate = require('../authenticate');
const RecipeMaster = require('../models/recipe-master');
const Recipe = require('../models/recipe');
const User = require('../models/user');

const recipeRouter = express.Router();

recipeRouter.use(bodyParser.json());

/* Public Accessible */

// GET requests only for recipes that are marked as public

recipeRouter.route('/public/:userId')
  .get((req, res, next) => {
    User.findById(req.params.userId)
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
      .then(user => {
        if (user !== null) {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(user.masterList.filter(master => {
            return master.isPublic;
          }));
        } else {
          const err = new Error('User not found');
          err.status = 404;
          return next(err);
        }
      })
      .catch(err => next(err));
  });

recipeRouter.route('/public/master/:masterRecipeId')
  .get((req, res, next) => {
    RecipeMaster.findById(req.params.masterRecipeId)
      .populate('style')
      .populate({
        path: 'recipes',
        populate: {
          path: 'grains.grainType'
        }
      })
      .populate({
        path: 'recipes',
        populate: {
          path: 'hops.hopsType'
        }
      })
      .populate({
        path: 'recipes',
        populate: {
          path: 'yeast.yeastType'
        }
      })
      .then(masterRecipe => {
        if (masterRecipe !== null && masterRecipe.isPublic) {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(masterRecipe);
        } else if (masterRecipe) {
          res.statusCode = 200;
          res.setHeader('content-type', 'applications/json');
          res.json({
            status: 'nok',
            message: `Recipe with id: "${req.params.masterRecipeId}" is private`
          });
        } else {
          const err = new Error(`Recipe with id: "${req.params.masterRecipeId}" not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch(err => next(err));
  });

recipeRouter.route('/public/master/:masterRecipeId/recipe/:recipeId')
  .get((req, res, next) => {
    RecipeMaster.findOne({_id: req.params.masterRecipeId, recipes: req.params.recipeId})
      .then(masterRecipe => {
        if (masterRecipe !== null && masterRecipe.isPublic) {
          return Recipe.findById(req.params.recipeId)
            .populate('grains.grainType')
            .populate('hops.hopsType')
            .populate('yeast.yeastType')
            .then(recipe => {
              if (recipe !== null) {
                res.statusCode = 200;
                res.setHeader('content-type', 'application/json');
                res.json(recipe);
              } else {
                const err = new Error(`Batch with id: "${req.params.recipeId}" not found`);
                err.status = 404;
                return next(err);
              }
            });
        } else if (masterRecipe) {
          res.statusCode = 200;
          res.setHeader('content-type', 'applications/json');
          res.json({
            status: 'nok',
            message: `Recipe with id: "${req.params.masterRecipeId}" is private`
          });
        } else {
          const err = new Error(`Recipe with id: "${req.params.masterRecipeId}" not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch(err => next(err));
  });

/* Private Accessible */

// CRUD Operations only performed by User

recipeRouter.route('/private/user')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
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
      .then(user => {
        if (user !== null) {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(user.masterList);
        } else {
          const err = new Error('Could not find user');
          err.status = 404;
          return next(err);
        }
      })
      .catch(err => next(err));
  })
  .post(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user !== null) {
          req.body.recipe.isMaster = true;
          return Recipe.create(req.body.recipe)
            .then(newRecipe => {
              req.body.master['owner'] = req.user.id;
              req.body.master['master'] = newRecipe._id;
              req.body.master['recipes'] = [newRecipe];
              return RecipeMaster.create(req.body.master)
                .then(newMaster => {
                  user.masterList.push(newMaster);
                  return user.save()
                    .then(() => {
                      newRecipe.owner = newMaster._id;
                      return newRecipe.save()
                        .then(() => {
                          return RecipeMaster.findById(newMaster._id)
                            .populate('style')
                            .populate({
                              path: 'recipes',
                              populate: {
                                path: 'grains.grainType'
                              }
                            })
                            .populate({
                              path: 'recipes',
                              populate: {
                                path: 'hops.hopsType'
                              }
                            })
                            .populate({
                              path: 'recipes',
                              populate: {
                                path: 'yeast.yeastType'
                              }
                            })
                            .then(forResponse => {
                              res.statusCode = 201;
                              res.setHeader('content-type', 'application/json');
                              res.json(forResponse);
                            });
                        });
                    });
                });
            });
        } else {
          const err = new Error('Could not find user');
          err.status = 404;
          return next(err);
        }
      })
      .catch(err => next(err));
  });

recipeRouter.route('/private/master/:masterRecipeId')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user !== null
            && user.masterList.some(recipe => recipe.equals(req.params.masterRecipeId))) {
          return RecipeMaster.findById(req.params.masterRecipeId)
            .populate('style')
            .populate({
              path: 'recipes',
              populate: {
                path: 'grains.grainType'
              }
            })
            .populate({
              path: 'recipes',
              populate: {
                path: 'hops.hopsType'
              }
            })
            .populate({
              path: 'recipes',
              populate: {
                path: 'yeast.yeastType'
              }
            })
            .then(masterRecipe => {
              if (masterRecipe) {
                res.statusCode = 200;
                res.setHeader('content-type', 'application/json');
                res.json(masterRecipe);
              } else {
                const err = new Error(`Recipe with id: "${req.params.masterRecipeId}" not found`);
                err.status = 404;
                return next(err);
              }
            });
        } else {
          const err = (user !== null)
                      ? new Error(`Could not find master with id ${req.params.masterRecipeId}`)
                      : new Error('Could not find user');
          err.status = 404;
          return next(err);
        }
      })
      .catch(err => next(err));
  })
  .post(authenticate.verifyUser, (req, res, next) => {
    User.findOne({_id: req.user.id, masterList: req.params.masterRecipeId})
      .then(user => {
        if (user !== null) {
          return RecipeMaster.findById(req.params.masterRecipeId)
            .then(master => {
              if (req.body.isMaster) {
                return Recipe.findOneAndUpdate({_id: {$in: master.recipes}, isMaster: true}, {$set: {isMaster: false}})
                  .then(oldRecipe => {
                    return master;
                  });
              } else {
                return master;
              }
            })
            .then(master => {
              return Recipe.create(req.body)
                .then(newRecipe => {
                  master.recipes.push(newRecipe);
                  if (master.recipes.length === 1 || req.body.isMaster) {
                    master.master = newRecipe.id;
                  }
                  return master.save()
                    .then(saved => {
                      return Recipe.findById(newRecipe.id)
                        .populate('grains.grainType')
                        .populate('hops.hopsType')
                        .populate('yeast.yeastType')
                        .then(forResponse => {
                          res.statusCode = 200;
                          res.setHeader('content-type', 'application/json');
                          res.json(forResponse);
                        })
                    });
                });
            });
        } else {
          const err = new Error('Could not find user');
          err.status = 404;
          return next(err);
        }
      })
      .catch(err => next(err));
  })
  .patch(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user !== null && user.masterList.some(recipe => recipe.equals(req.params.masterRecipeId))) {
          return RecipeMaster.findByIdAndUpdate(
              req.params.masterRecipeId,
              req.body,
              {new: true}
            )
            .populate('style')
            .populate({
              path: 'recipes',
              populate: {
                path: 'grains.grainType'
              }
            })
            .populate({
              path: 'recipes',
              populate: {
                path: 'hops.hopsType'
              }
            })
            .populate({
              path: 'recipes',
              populate: {
                path: 'yeast.yeastType'
              }
            })
            .then(updated => {
              res.statusCode = 200;
              res.setHeader('content-type', 'application/json');
              res.json(updated);
            });
        } else {
          const err = new Error('Could not find user');
          err.status = 404;
          return next(err);
        }
      })
      .catch(err => next(err));
  })
  .delete(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user !== null
            && user.masterList.some(recipe => recipe.equals(req.params.masterRecipeId))) {
          return RecipeMaster.findByIdAndDelete(req.params.masterRecipeId)
            .then(dbres => {
              if (dbres) {
                let toRemove = -1;
                for (let i=0; i < user.masterList.length; i++) {
                  if (user.masterList[i].equals(req.params.masterRecipeId)) {
                    toRemove = i;
                    break;
                  }
                }
                if (toRemove !== -1) {
                  user.masterList.splice(toRemove, 1);
                  return Recipe.deleteMany({_id: {$in: dbres.recipes}})
                    .then(recipeDBres => {
                      return user.save()
                        .then(() => {
                          res.statusCode = 200;
                          res.setHeader('content-type', 'application/json');
                          res.json(dbres);
                        });
                    });
                }
              }
            });
        } else {
          const err = new Error('Could not find user');
          err.status = 404;
          return next(err);
        }
      })
      .catch(err => next(err));
  });

recipeRouter.route('/private/master/:masterRecipeId/recipe/:recipeId')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findOne({_id: req.user.id, masterList: req.params.masterRecipeId})
      .then(user => {
        if (user !== null) {
          return RecipeMaster.findById(req.params.masterRecipeId)
            .then(master => {
              if (master) {
                const _recipe = master.recipes.find(item => item.equals(req.params.recipeId));
                return Recipe.findById(_recipe)
                  .populate('grains.grainType')
                  .populate('hops.hopsType')
                  .populate('yeast.yeastType')
                  .then(recipe => {
                    res.statusCode = 200;
                    res.setHeader('content-type', 'application/json');
                    res.json(recipe);
                  });
              } else {
                const err = new Error(`Batch with id: "${req.params.recipeId}" not found`);
                err.status = 404;
                return next(err);
              }
            });
        } else {
          const err = new Error('Could not find user');
          err.status = 404;
          return next(err);
        }
      })
      .catch(err => next(err));
  })
  .patch(authenticate.verifyUser, (req, res, next) => {
    User.findOne({_id: req.user.id, masterList: req.params.masterRecipeId})
      .then(user => {
        if (user !== null) {
          return RecipeMaster.findById(req.params.masterRecipeId)
            .then(master => {
              const recipe = master.recipes.find(item => item.equals(req.params.recipeId));
              if (recipe && req.body.isMaster === false && master.recipes.length < 2) {
                const err = new Error('At least one recipe must be set as master');
                err.status = 409;
                return next(err);
              } else if (recipe) {
                return Recipe.findByIdAndUpdate(
                  recipe,
                  req.body,
                  {new: true}
                )
                .populate('grains.grainType')
                .populate('hops.hopsType')
                .populate('yeast.yeastType')
                .then(updated => {
                  if (req.body.isMaster && !updated.equals(master.master)) {
                    return Recipe.findByIdAndUpdate(master.master, {$set: {isMaster: false}})
                      .then(reset => {
                        master.master = updated._id;
                        return master.save()
                          .then(dbres => {
                            res.statusCode = 200;
                            res.setHeader('content-type', 'application/json');
                            res.json(updated);
                          });
                      });
                  } else {
                    res.statusCode = 200;
                    res.setHeader('content-type', 'application/json');
                    res.json(updated);
                  }
                });
              } else {
                const err = new Error(`Batch with id: "${req.params.recipeId}" not found`);
                err.status = 404;
                return next(err);
              }
            })
        } else {
          const err = new Error('Could not find user');
          err.status = 404;
          return next(err);
        }
      })
      .catch(err => next(err));
  })
  .delete(authenticate.verifyUser, (req, res, next) => {
    User.findOne({_id: req.user.id, masterList: req.params.masterRecipeId})
      .then(user => {
        if (user !== null) {
          return RecipeMaster.findById(req.params.masterRecipeId)
            .then(master => {
              const recipe = master.recipes.find(item => item.equals(req.params.recipeId));
              if (recipe) {
                return Recipe.findByIdAndDelete(recipe)
                  .then(dbres => {
                    if (dbres) {
                      let toRemove = -1;
                      for (let i=0; i < master.recipes.length; i++) {
                        if (master.recipes[i].equals(req.params.recipeId)) {
                          toRemove = i;
                          break;
                        }
                      }
                      if (toRemove !== -1) {
                        master.recipes.splice(toRemove, 1);
                      }
                      if (dbres.isMaster) {
                        master.master = master.recipes.find(item => !item.equals(req.params.recipeId));
                      }
                      return Recipe.findByIdAndUpdate(master.master, {$set: {isMaster: true}}, {new: true})
                        .then(newMaster => {
                          return master.save()
                            .then(() => {
                              res.statusCode = 200;
                              res.setHeader('content-type', 'application/json');
                              res.json({deleted: dbres, newMaster: newMaster});
                            });
                        });
                    }
                  });
              } else {
                const err = new Error(`Batch with id: "${req.params.recipeId}" not found`);
                err.status = 404;
                return next(err);
              }
            });
        } else {
          const err = new Error('Could not find user');
          err.status = 404;
          return next(err);
        }
      })
      .catch(err => next(err));
  });

module.exports = recipeRouter;
