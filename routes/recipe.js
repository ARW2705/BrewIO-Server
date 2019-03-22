'use strict';

const createError = require('http-errors');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const authenticate = require('../authenticate');
const RecipeMaster = require('../models/recipe-master');
const Recipe = require('../models/recipe');

const recipeRouter = express.Router();

recipeRouter.use(bodyParser.json());

/* Public Accessible */

// GET requests only for recipes that are marked as public

recipeRouter.route('/public/:userId')
  .get((req, res, next) => {
    User.findById(req.params.userId)
      .populate('masterList.style')
      .populate('masterList.master')
      .populate('masterList.recipes.grains.grainType')
      .populate('masterList.recipes.hops.hopsType')
      .populate('masterList.recipes.yeast.yeastType')
      .then(user => {
        if (user != null) {
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
    User.find({'masterList._id': req.params.masterRecipeId})
      .populate('style')
      .populate('master')
      .populate('recipes.grains.grainType')
      .populate('recipes.hops.hopsType')
      .populate('recipes.yeast.yeastType')
      .then(masterRecipe => {
        if (masterRecipe != null && masterRecipe.isPublic) {
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
    User.find({'masterList._id': req.params.masterRecipeId})
      .populate('style')
      .populate('master')
      .populate('recipes.grains.grainType')
      .populate('recipes.hops.hopsType')
      .populate('recipes.yeast.yeastType')
      .then(masterRecipe => {
        if (masterRecipe != null && masterRecipe.isPublic) {
          const batch = masterRecipe.recipes.id(req.params.recipeId);
          if (batch) {
            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            res.json(batch);
          } else {
            const err = new Error(`Batch with id: "${req.params.recipeId}" not found`);
            err.status = 404;
            return next(err);
          }
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
      .populate('masterList.style')
      .populate('masterList.master')
      .populate('masterList.recipes.grains.grainType')
      .populate('masterList.recipes.hops.hopsType')
      .populate('masterList.recipes.yeast.yeastType')
      .then(user => {
        if (user != null) {
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
        if (user != null) {
          return RecipeMaster.create(req.body)
            .populate('style')
            .populate('master')
            .populate('recipes.grains.grainType')
            .populate('recipes.hops.hopsType')
            .populate('recipes.yeast.yeastType')
            .then(newMaster => {
              user.masterList.push(newMaster);
              return user.save()
                .then(() => {
                  res.statusCode = 201;
                  res.setHeader('content-type', 'application/json');
                  res.json(newMaster);
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
      .populate('masterList.style')
      .populate('masterList.master')
      .populate('masterList.recipes.grains.grainType')
      .populate('masterList.recipes.hops.hopsType')
      .populate('masterList.recipes.yeast.yeastType')
      .then(user => {
        if (user != null) {
          const masterRecipe = user.masterList.id(req.params.masterRecipeId);
          if (masterRecipe) {
            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            res.json(masterRecipe);
          } else {
            const err = new Error(`Recipe with id: "${req.params.masterRecipeId}" not found`);
            err.status = 404;
            return next(err);
          }
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
        if (user != null) {
          const masterRecipe = user.masterList.id(req.params.masterRecipeId);
          if (masterRecipe) {
            return Recipe.create(req.body)
              .populate('grains.grainType')
              .populate('hops.hopsType')
              .populate('yeast.yeastType')
              .then(newRecipe => {
                masterRecipe.recipes.push(newRecipe);
                return masterRecipe.save()
                  .then(() => {
                    res.statusCode = 200;
                    res.setHeader('content-type', 'application/json');
                    res.json(newRecipe);
                  });
              });
          } else {
            const err = new Error(`Recipe with id: "${req.params.masterRecipeId}" not found`);
            err.status = 404;
            return next(err);
          }
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
        if (user != null) {
          const masterRecipe = user.masterList.id(req.params.masterRecipeId);
          if (masterRecipe) {
            return RecipeMaster.findByIdAndUpdate(
              masterRecipe.id,
              req.body,
              {new: true}
            )
            .populate('style')
            .populate('master')
            .populate('recipes.grains.grainType')
            .populate('recipes.hops.hopsType')
            .populate('recipes.yeast.yeastType')
            .then(updated => {
              res.statusCode = 200;
              res.setHeader('content-type', 'application/json');
              res.json(updated);
            });
          } else {
            const err = new Error(`Recipe with id: "${req.params.masterRecipeId}" not found`);
            err.status = 404;
            return next(err);
          }
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
        if (user != null) {
          const masterRecipe = user.masterList.id(req.params.masterRecipeId);
          if (masterRecipe) {
            return RecipeMaster.findByIdAndDelete(masterRecipe.id)
              .then(dbres => {
                res.statusCode = 200;
                res.setHeader('content-type', 'application/json');
                res.json(dbres);
              });
          } else {
            const err = new Error(`Recipe with id: "${req.params.masterRecipeId}" not found`);
            err.status = 404;
            return next(err);
          }
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
    User.findById(req.user.id)
      .then(user => {
        if (user != null) {
          const masterRecipe = user.masterList.id(req.params.masterRecipeId);
          if (masterRecipe) {
            const recipe = masterRecipe.recipes.id(req.params.recipeId);
            if (recipe) {
              return Recipe.findById(recipe.id)
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
          } else {
            const err = new Error(`Recipe with id: "${req.params.masterRecipeId}" not found`);
            err.status = 404;
            return next(err);
          }
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
        if (user != null) {
          const masterRecipe = user.masterList.id(req.params.masterRecipeId);
          if (masterRecipe) {
            const recipe = masterRecipe.recipes.id(req.params.recipeId);
            if (recipe) {
              return Recipe.findByIdAndUpdate(
                recipe.id,
                req.body,
                {new: true}
              )
              .populate('grains.grainType')
              .populate('hops.hopsType')
              .populate('yeast.yeastType')
              .then(updated => {
                res.statusCode = 200;
                res.setHeader('content-type', 'application/json');
                res.json(updated);
              });
            } else {
              const err = new Error(`Batch with id: "${req.params.recipeId}" not found`);
              err.status = 404;
              return next(err);
            }
          } else {
            const err = new Error(`Recipe with id: "${req.params.masterRecipeId}" not found`);
            err.status = 404;
            return next(err);
          }
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
        if (user != null) {
          const masterRecipe = user.masterList.id(req.params.masterRecipeId);
          if (masterRecipe) {
            const recipe = masterRecipe.recipes.id(req.params.recipeId);
            if (recipe) {
              return Recipe.findByIdAndDelete(recipe.id)
                .then(dbres => {
                  res.statusCode = 200;
                  res.setHeader('content-type', 'application/json');
                  res.json(dbres);
                });
            } else {
              const err = new Error(`Batch with id: "${req.params.recipeId}" not found`);
              err.status = 404;
              return next(err);
            }
          } else {
            const err = new Error(`Recipe with id: "${req.params.masterRecipeId}" not found`);
            err.status = 404;
            return next(err);
          }
        } else {
          const err = new Error('Could not find user');
          err.status = 404;
          return next(err);
        }
      })
      .catch(err => next(err));
  });

module.exports = recipeRouter;
