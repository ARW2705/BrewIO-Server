'use strict';

const createError = require('http-errors');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const authenticate = require('../../authenticate');
const Style = require('../../models/style');

const styleRouter = express.Router();

styleRouter.use(bodyParser.json());

styleRouter.route('/')
  .get((req, res, next) => {
    Style.find({})
      .then(style => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(style);
      }, error => next(error))
      .catch(error => next(error));
  })
  .post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Style.create(req.body)
      .then(style => {
        res.statusCode = 201;
        res.setHeader('content-type', 'application/json');
        res.json(style);
      }, error => next(error))
      .catch(error => next(error));
  });

styleRouter.route('/:styleId')
  .get((req, res, next) => {
    Style.findById(req.params.styleId)
      .then(style => {
        if (style != null) {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(style);
        } else {
          return next(createError(404));
        }
      }, error => next(error))
      .catch(error => next(error))
  })
  .patch(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Style.findByIdAndUpdate(req.params.styleId, req.body, {new: true})
      .then(style => {
        if (style != null) {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(style);
        } else {
          return next(createError(404));
        }
      }, error => next(error))
      .catch(error => next(error));
  })
  .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Style.findByIdAndDelete(req.params.styleId)
      .then(dbres => {
        if (dbres != null) {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(dbres);
        } else {
          return next(createError(404));
        }
      }, error => next(error))
      .catch(error => next(error));
  });

module.exports = styleRouter;
