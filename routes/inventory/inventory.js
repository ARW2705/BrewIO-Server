'use strict';

const createError = require('create-error');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const authenticate = require('../../authenticate');
const User = require('../../models/user');
const Inventory = require('../../models/inventory/inventory');

const inventoryRouter = express.Router();

inventoryRouter.use(bodyParser.json());

/* Inventory Tracking Routes */

inventoryRouter.route('/')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .populate({
        path: 'inventory',
        populate: {
          path: 'details',
          populate: {
            path: 'brewery'
          }
        }
      })
      .populate({
        path: 'inventory',
        populate: {
          path: 'details',
          populate: {
            path: 'collaborations'
          }
        }
      })
      .then(user => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(user.inventory);
      })
      .catch(error => next(error));
  })
  .post(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .populate({
        path: 'inventory',
        populate: {
          path: 'details',
          populate: {
            path: 'brewery'
          }
        }
      })
      .populate({
        path: 'inventory',
        populate: {
          path: 'details',
          populate: {
            path: 'collaborations'
          }
        }
      })
      .then(user => {
        return Inventory.create(req.body)
          .then(item => {
            user.inventory.push(item);
            return user.save()
              .then(_ => {
                res.statusCode = 201;
                res.setHeader('content-type', 'application/json');
                res.json(item);
              })
          })
      })
      .catch(error => next(error));
  });

inventoryRouter.route('/:itemId')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .populate({
        path: 'inventory',
        populate: {
          path: 'details',
          populate: {
            path: 'brewery'
          }
        }
      })
      .populate({
        path: 'inventory',
        populate: {
          path: 'details',
          populate: {
            path: 'collaborations'
          }
        }
      })
      .then(user => {
        if (user.inventory.includes(req.params.itemId)) {
          return Inventory.findById(req.params.itemId)
            .then(item => {
              res.statusCode = 200;
              res.setHeader('content-type', 'application/json');
              res.json(item);
            })
        } else {
          throw new Error(`Inventory item with id ${req.params.itemId} could not be found`);
        }
      })
      .catch(error => next(error));
  })
  .patch(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .populate({
        path: 'inventory',
        populate: {
          path: 'details',
          populate: {
            path: 'brewery'
          }
        }
      })
      .populate({
        path: 'inventory',
        populate: {
          path: 'details',
          populate: {
            path: 'collaborations'
          }
        }
      })
      .then(user => {
        if (user.inventory.includes(req.params.itemId)) {
          return Inventory.findByIdAndUpdate(req.params.itemId, req.body, {new: true})
            .then(updatedItem => {
              res.statusCode = 200;
              res.setHeader('content-type', 'application/json');
              res.json(updatedItem);
            })
        } else {
          throw new Error(`Inventory item with id ${req.params.itemId} could not be found`);
        }
      })
      .catch(error => next(error));
  })
  .delete(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (user.inventory.includes(req.params.itemId)) {
          const toDelete = user.inventory.findIndex(item => item._id === req.params.itemId);
          user.inventory.splice(toDelete, 1);
          return Inventory.deleteById(req.params.itemId)
            .then(dbres => {
              res.statusCode = 200;
              res.setHeader('content-type', 'application/json');
              res.json({success: true});
            })
        } else {
          throw new Error(`Inventory item with id ${req.params.itemId} could not be found`);
        }
      })
      .catch(error => next(error));
  });
