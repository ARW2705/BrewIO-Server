'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const httpError = require('../utils/http-error');
const authenticate = require('../authenticate');
const imageFileHandler = require('./images/image-helpers');
const User = require('../models/user');
const Recipe = require('../models/recipe-master');
const Batch = require('../models/batch');
const Inventory = require('../models/inventory');

const adminRouter = express.Router();

adminRouter.use(bodyParser.json());

// Recipe routes
adminRouter.route('/recipe/:recipeMasterId')
  .get(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Recipe.findById(req.params.recipeMasterId)
      .then(recipeMaster => {
        if (recipeMaster) {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(recipeMaster);
        } else {
          throw httpError(404, 'Recipe master not found');
        }
      })
      .catch(next);
  })
  .patch(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    const update = req.body.update;
    const deleteImages = req.body.deleteImages || [];

    Recipe.findByIdAndUpdate(req.params.recipeMasterId, { $set: update }, { new: true })
      .then(updated => {
        if (updated) {
          return Promise.all([ Promise.resolve(updated), ...deleteImages ]);
        } else {
          throw httpError(404, 'Recipe master not found');
        }
      })
      .then(results => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(results);
      })
      .catch(next);
  })
  .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Recipe.findByIdAndDelete(req.params.recipeMasterId)
      .then(dbres => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(dbres);
      })
      .catch(next);
  });


// Batch routes
adminRouter.route('/batch/:batchId')
  .get(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Batch.findById(req.params.recipeMasterId)
      .then(batch => {
        if (batch) {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(batch);
        } else {
          throw httpError(404, 'Batch master not found');
        }
      })
      .catch(next);
  })
  .patch(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Batch.findByIdAndUpdate(req.params.batchId, { $set: req.body }, { new: true })
      .then(updated => {
        if (updated) {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(updated);
        } else {
          throw httpError(404, 'Batch not found');
        }
      })
      .catch(next);
  })
  .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Batch.findByIdAndDelete(req.params.recipeMasterId)
      .then(dbres => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(dbres);
      })
      .catch(next);
  });


// Inventory routes
adminRouter.route('/inventory/:itemId')
  .get(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Inventory.findById(req.params.itemId)
      .then(item => {
        if (item) {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(item);
        } else {
          throw httpError(404, 'Item not found');
        }
      })
      .catch(next);
  })
  .patch(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    const update = req.body.update;
    const deleteImages = req.body.deleteImages || [];

    Inventory.findByIdAndUpdate(req.params.recipeMasterId, { $set: update }, { new: true })
      .then(updated => {
        if (updated) {
          return Promise.all([ Promise.resolve(updated), ...deleteImages ]);
        } else {
          throw httpError(404, 'Item not found');
        }
      })
      .then(results => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(results);
      })
      .catch(next);
  })
  .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Inventory.findByIdAndDelete(req.params.recipeMasterId)
      .then(dbres => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(dbres);
      })
      .catch(next);
  });


// User routes
adminRouter.route('/user/:userId')
  .get(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    User.findById(req.params.userId)
      .then(user => {
        if (user) {
          if (user.hash) {
            delete user.hash;
          }
          if (user.salt) {
            delete user.salt;
          }

          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(user);
        } else {
          throw httpError(404, 'User not found');
        }
      })
      .catch(next);
  })
  .patch(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    const update = req.body.update;
    const deleteImages = req.body.deleteImages || [];

    User.findByIdAndUpdate(req.params.userId, { $set: update }, { new: true })
      .then(updated => {
        if (updated) {
          return Promise.all([ Promise.resolve(updated), ...deleteImages ])
        } else {
          throw httpError(404, 'User not found');
        }
      })
      .then(results => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(results);
      })
      .catch(next);
  })
  .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    User.findById(req.params.userId)
      .then(user => {
        if (user) {
          return Promise.all([
            Recipe.deleteMany({ _id: { $in: user.masterList } }),
            Batch.deleteMany({ _id: { $in: user.batchlist } }),
            Inventory.deleteMany({ _id: { $in: user.inventoryList } })
          ]);
        } else {
          throw httpError(404, 'User not found');
        }
      })
      .then(deletions => {
        return User.findByIdAndDelete(req.params.userId)
          .then(dbres => {
            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            res.json({ doc: dbres, subdocs: deletions });
          });
      })
      .catch(next);
  });

adminRouter.route('/user/:userId/recipes')
  .get(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    User.findById(req.params.userId)
      .then(user => {
        if (user) {
          return Recipe.find({ _id: { $in: user.masterList } });
        } else {
          throw httpError(404, 'User not found');
        }
      })
      .then(recipes => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(recipes);
      })
      .catch(next);
  });

adminRouter.route('/user/:userId/batch')
  .get(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    User.findById(req.params.userId)
      .then(user => {
        if (user) {
          return Batch.find({ _id: { $in: user.batchList } });
        } else {
          throw httpError(404, 'User not found');
        }
      })
      .then(recipes => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(recipes);
      })
      .catch(next);
  });

adminRouter.route('/user/:userId/inventory')
  .get(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    User.findById(req.params.userId)
      .then(user => {
        if (user) {
          return Inventory.find({ _id: { $in: user.inventoryList } });
        } else {
          throw httpError(404, 'User not found');
        }
      })
      .then(recipes => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(recipes);
      })
      .catch(next);
  });
