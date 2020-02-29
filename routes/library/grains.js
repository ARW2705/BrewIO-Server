'use strict';

const createError = require('http-errors');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const authenticate = require('../../authenticate');
const Grains = require('../../models/grains');

const grainsRouter = express.Router();

grainsRouter.use(bodyParser.json());

grainsRouter.route('/')
  .get((req, res, next) => {
    Grains.find({})
      .then(grains => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(grains);
      }, error => next(error))
      .catch(error => next(error));
  })
  .post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Grains.create(req.body)
      .then(grains => {
        res.statusCode = 201;
        res.setHeader('content-type', 'application/json');
        res.json(grains);
      }, error => next(error))
      .catch(error => next(error));
  });

grainsRouter.route('/:grainsId')
  .get((req, res, next) => {
    Grains.findById(req.params.grainsId)
      .then(grains => {
        if (grains !== null) {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(grains);
        } else {
          return next(createError(404));
        }
      }, error => next(error))
      .catch(error => next(error))
  })
  .patch(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Grains.findByIdAndUpdate(req.params.grainsId, req.body, {new: true})
      .then(grains => {
        if (grains !== null) {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(grains);
        } else {
          return next(createError(404));
        }
      }, error => next(error))
      .catch(error => next(error));
  })
  .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Grains.findByIdAndDelete(req.params.grainsId)
      .then(dbres => {
        if (dbres !== null) {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(dbres);
        } else {
          return next(createError(404));
        }
      }, error => next(error))
      .catch(error => next(error));
  });

module.exports = grainsRouter;
