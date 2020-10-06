'use strict';

const httpError = require('../../utils/http-error');
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
      .then(styles => {
        if (styles === null || styles.length === 0) {
          throw httpError(404, 'Style entries not found');
        }

        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(styles);
      })
      .catch(next);
  })
  .post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Style.create(req.body)
      .then(style => {
        if (style === null) {
          throw httpError(500, 'Failed to create new style instance');
        }

        res.statusCode = 201;
        res.setHeader('content-type', 'application/json');
        res.json(style);
      })
      .catch(next);
  });

styleRouter.route('/:styleId')
  .get((req, res, next) => {
    Style.findById(req.params.styleId)
      .then(style => {
        if (style === null) {
          throw httpError(404, 'Style instance not found');
        }

        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(style);
      })
      .catch(next)
  })
  .patch(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Style.findByIdAndUpdate(req.params.styleId, req.body, {new: true})
      .then(style => {
        if (style === null) {
          throw httpError(500, 'Failed to update style instance');
        }

        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(style);
      })
      .catch(next);
  })
  .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Style.findByIdAndDelete(req.params.styleId)
      .then(dbres => {
        if (dbres === null) {
          throw httpError(500, 'Failed to delete style instance');
        }

        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(dbres);
      })
      .catch(next);
  });

module.exports = styleRouter;
