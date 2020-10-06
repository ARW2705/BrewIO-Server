'use strict';

const httpError = require('../utils/http-error');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const authenticate = require('../authenticate');
const Inventory = require('../models/inventory');
const User = require('../models/user');
const Recipe = require('../models/recipe-master');

const inventoryRouter = express.Router();

inventoryRouter.use(bodyParser.json());

inventoryRouter.route('/')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user === null) {
          throw httpError(404, 'Could not find user document');
        }
        return Inventory.find({_id: {$in: user.inventoryList} });
      })
      .then(inventory => {
        if (inventory === null) {
          throw httpError(404, 'Inventory not found');
        }
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(inventory);
      })
      .catch(next);
  })
  .post(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user === null) {
          throw httpError(404, 'Could not find user record');
        }
        return Inventory.create(req.body)
          .then(newItem => {
            user.inventoryList.push(newItem);
            return user.save()
              .then(_update => {
                res.statusCode = 201;
                res.setHeader('content-type', 'application/json');
                res.json(newItem);
              })
          })
      })
      .catch(next);
  });

inventoryRouter.route('/:itemId')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user === null) {
          throw httpError(404, 'Could not find user record');
        }
        return Inventory.findById(req.params.itemId)
          .then(item => {
            if (item !== null) {
              res.statusCode = 200;
              res.setHeader('content-type', 'application/json');
              return res.json(item);
            }
            throw httpError(404, 'Could not find batch record');
          });
      })
      .catch(error => next(error));
  })
  .patch(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user === null) {
          throw httpError(404, 'Could not find user record');
        }
        return Inventory.findByIdAndUpdate(req.params.itemId, { $set: req.body }, {new: true});
      })
      .then(updatedItem => {
        if (updatedItem === null) {
          throw httpError(404, 'Could not find batch record');
        }
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(updatedItem);
      })
      .catch(next);
  })
  .delete(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user === null) {
          throw httpError(404, 'Could not find user record');
        }
        return Inventory.findByIdAndDelete(req.params.itemId)
          .then(dbres => {
            if (dbres === null) {
              throw httpError(404, 'Could not find batch record');
            }
            const toDeleteIndex = user.inventoryList.findIndex(item => {
              return item._id.equals(req.params.itemId);
            });
            user.inventoryList.splice(toDeleteIndex, 1);
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

module.exports = inventoryRouter;
