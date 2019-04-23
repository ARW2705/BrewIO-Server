'use strict';

const createError = require('http-errors');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const authenticate = require('../authenticate');
const RecipeMaster = require('../models/recipe-master');
const Recipe = require('../models/recipe');
const User = require('../models/user');

const processRouter = express.Router();

processRouter.use(bodyParser.json());

processRouter.route('/master/:masterId/recipe/:recipeId')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findOne({_id: req.user.id, masterList: req.params.masterRecipeId})
      .then(user => {
        if (user != null) {
          return RecipeMaster.findById(req.params.masterRecipeId)
            .then(master => {
              if (master) {
                const recipe = master.recipes.find(item => item.equals(req.params.recipeId));
                return Recipe.findById(recipe)
                  .then(recipe => {
                    res.statusCode = 200;
                    res.setHeader('content-type', 'application/json');
                    res.json(recipe.processSchedule);
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

processRouter.route('/master/:masterId/recipe/:recipeId/step/:stepId')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findOne({_id: req.user.id, masterList: req.params.masterRecipeId})
      .then(user => {
        if (user) {
          return RecipeMaster.findById(req.params.masterRecipeId)
            .then(master => {
              if (master) {
                const _recipe = master.recipes.find(item => item.equals(req.params.recipeId));
                return Recipe.findById(_recipe)
                  .then(recipe => {
                    if (recipe) {
                      const step = recipe.processSchedule.find(step => step.equals(req.params.stepId));
                      if (step) {
                        res.statusCode = 200;
                        res.setHeader('content-type', 'application/json');
                        res.json(step);
                      } else {
                        const err = new Error(`Step with id: "${req.params.stepId}" not found`);
                        err.status = 404;
                        return next(err);
                      }
                    } else {
                      const err = new Error(`Recipe with id: "${req.params.recipeId}" not found`);
                      err.status = 404;
                      return next(err);
                    }
                  });
              } else {
                const err = new Error(`Master with id: "${req.params.masterId}" not found`);
                err.status = 404;
                return next(err);
              }
            });
      })
      .catch(err => next(err));
  })
  .patch(authenticate.verifyUser, (req, res, next) => {
    User.findOne({_id: req.user.id, masterList: req.params.masterRecipeId})
      .then(user => {
        if (user != null) {
          return RecipeMaster.findById(req.params.masterRecipeId)
            .then(master => {
              if (master) {
                const _recipe = master.recipes.find(item => item.equals(req.params.recipeId));
                return Recipe.findById(_recipe)
                  .then(recipe => {
                    if (recipe) {
                      const toUpdate = recipe.processSchedule.find(step => step.equals(req.params.stepId));
                      console.log('pre', toUpdate);
                      for (const key in req.body) {
                        if (key == '_id') continue;
                        toUpdate[key] = req.body[key];
                      }
                      console.log('post', toUpdate);
                      return recipe.save()
                        .then(dbres => {
                          res.statusCode = 200;
                          res.setHeader('content-type', 'application/json');
                          res.json(toUpdate);
                        });
                    } else {
                      const err = new Error(`Batch with id: "${req.params.recipeId}" not found`);
                      err.status = 404;
                      return next(err);
                  });
              } else {
                const err = new Error(`Recipe with id: "${req.params.masterId}" not found`);
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

module.exports = processRouter;
