'use strict';

const httpError = require('../../utils/http-error');
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
        if (grains === null || grains.length === 0) {
          throw httpError(404, 'Grain entries not found');
        }

        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(grains);
      })
      .catch(next);
  })
  .post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Grains.create(req.body)
      .then(grains => {
        if (grains === null) {
          throw httpError(500, 'Failed to create new grains instance');
        }

        res.statusCode = 201;
        res.setHeader('content-type', 'application/json');
        res.json(grains);
      })
      .catch(next);
  });

grainsRouter.route('/:grainsId')
  .get((req, res, next) => {
    Grains.findById(req.params.grainsId)
      .then(grains => {
        if (grains === null) {
          throw httpError(404, 'Grains instance not found');
        }

        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(grains);
      })
      .catch(next)
  })
  .patch(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Grains.findByIdAndUpdate(req.params.grainsId, req.body, {new: true})
      .then(grains => {
        if (grains === null) {
          throw httpError(500, 'Failed to update grains instance');
        }

        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(grains);
      })
      .catch(next);
  })
  .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Grains.findByIdAndDelete(req.params.grainsId)
      .then(dbres => {
        if (dbres === null) {
          throw httpError(500, 'Failed to delete grains instance');
        }

        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(dbres);
      })
      .catch(next);
  });

module.exports = grainsRouter;
