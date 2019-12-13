'use strict';

const createError = require('http-errors');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const authenticate = require('../authenticate');
const Inventory = require('../models/inventory');
const RecipeMaster = require('../models/recipe-master');
const Recipe = require('../models/recipe');
const User = require('../models/user');

const inventoryRouter = express.Router();

inventoryRouter.use(bodyParser.json());

inventoryRouter.route('/')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user != null) {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(user.inventory);
        } else {
          return next(createError(404, 'Could not find user record'));
        }
      })
      .catch(error => next(error));
  })
  .post(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user != null) {
          return Inventory.create(req.body)
            .then(newItem => {
              user.inventory.push(newItem);
              return user.save()
                .then(_update => {
                  res.statusCode = 201;
                  res.setHeader('content-type', 'application/json');
                  res.json(newItem);
                })
            })
        } else {
          return next(createError(404, 'Could not find user record'));
        }
      })
      .catch(error => next(error));
  });

inventoryRouter.route('/:itemId')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user != null) {
          return Inventory.findById(req.params.itemId)
            .then(item => {
              if (item != null) {
                res.statusCode = 200;
                res.setHeader('content-type', 'application/json');
                res.json(item);
              } else {
                return next(createError(404, 'Could not find batch record'));
              }
            })
        } else {
          return next(createError(404, 'Could not find user record'));
        }
      })
      .catch(error => next(error));
  })
  .patch(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user != null) {
          return Inventory.findByIdAndUpdate(req.params.itemId, req.body, {new: true})
            .then(updatedItem => {
              if (updatedItem != null) {
                res.statusCode = 200;
                res.setHeader('content-type', 'application/json');
                res.json(updatedItem);
              } else {
                return next(createError(404, 'Could not find batch record'));
              }
            })
        } else {
          return next(createError(404, 'Could not find user record'));
        }
      })
      .catch(error => next(error));
  })
  .delete(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user != null) {
          return Inventory.findByIdAndDelete(req.params.itemId)
            .then(dbres => {
              if (dbres != null) {
                const toDeleteIndex = user.inventory.findIndex(item => {
                  return item._id.equals(req.params.itemId);
                });
                user.inventory.splice(toDeleteIndex, 1);
                return user.save()
                  .then(userUpdated => {
                    res.statusCode = 200;
                    res.setHeader('content-type', 'application/json');
                    res.json(dbres);
                  });
              } else {
                return next(createError(404, 'Could not find batch record'));
              }
            })
        } else {
          return next(createError(404, 'Could not find user record'));
        }
      })
      .catch(error => next(error));
  });

module.exports = inventoryRouter;
