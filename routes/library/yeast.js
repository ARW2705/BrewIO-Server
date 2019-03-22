'use strict';

const createError = require('http-errors');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const authenticate = require('../../authenticate');
const Yeast = require('../../models/yeast');

const yeastRouter = express.Router();

yeastRouter.use(bodyParser.json());

yeastRouter.route('/')
  .get((req, res, next) => {
    Yeast.find({})
      .then(yeast => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(yeast);
      }, error => next(error))
      .catch(error => next(error));
  })
  .post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Yeast.create(req.body)
      .then(yeast => {
        res.statusCode = 201;
        res.setHeader('content-type', 'application/json');
        res.json(yeast);
      }, error => next(error))
      .catch(error => next(error));
  });

yeastRouter.route('/:yeastId')
  .get((req, res, next) => {
    Malts.findById(req.params.yeastId)
      .then(yeast => {
        if (yeast != null) {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(yeast);
        } else {
          return next(createError(404));
        }
      }, error => next(error))
      .catch(error => next(error))
  })
  .patch(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Yeast.findByIdAndUpdate(req.params.yeastId, req.body, {new: true})
      .then(yeast => {
        if (yeast != null) {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(yeast);
        } else {
          return next(createError(404));
        }
      }, error => next(error))
      .catch(error => next(error));
  })
  .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Yeast.findByIdAndDelete(req.params.yeastId)
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

module.exports = yeastRouter;
