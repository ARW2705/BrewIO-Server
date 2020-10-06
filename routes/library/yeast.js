'use strict';

const httpError = require('../../utils/http-error');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const async = require('async');

const authenticate = require('../../authenticate');
const Yeast = require('../../models/yeast');
const Styles = require('../../models/style');

const yeastRouter = express.Router();

yeastRouter.use(bodyParser.json());

yeastRouter.route('/')
  .get((req, res, next) => {
    Yeast.find({})
      .populate('recommendedStyles')
      .then(yeast => {
        if (yeast === null || yeast.length === 0) {
          throw httpError(404, 'Yeast entries not found');
        }

        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(yeast);
      })
      .catch(next);
  })
  .post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Yeast.create(req.body)
      .then(yeast => {
        if (yeast === null) {
          throw httpError(500, 'Failed to create new yeast instance');
        }

        res.statusCode = 201;
        res.setHeader('content-type', 'application/json');
        res.json(yeast);
      })
      .catch(next);
  });

yeastRouter.route('/:yeastId')
  .get((req, res, next) => {
    Yeast.findById(req.params.yeastId)
      .populate('recommendedStyles')
      .then(yeast => {
        if (yeast === null) {
          throw httpError(404, 'Yeast instance not found');
        }

        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(yeast);
      })
      .catch(next)
  })
  .patch(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    if (req.body.styles) {
      Yeast.findById(req.params.yeastId)
        .then(yeastToUpdate => {
          if (yeastToUpdate === null) {
            throw httpError(404, 'Yeast instance not found');
          }

          const calls = [];

          // construct queries for Styles to search and then populate yeast doc
          // with matched Style ids - to be called later once all queries are ready
          req.body.styles.forEach(name => {
            calls.push(callback => {
              Styles.findOne({name: name})
                .then(style => {
                  if (style === null) {
                    callback('Style not found', null);
                  } else {
                    if (!yeastToUpdate.recommendedStyles.find(elem => elem.equals(style.id))) {
                      yeastToUpdate.recommendedStyles.push(style.id);
                    }
                    callback(null, true);
                  }
                });
            })
          });

          // Perform all pre-made queries, then respond with original yeast save result
          return async.parallel(calls, (err, results) => {
            if (err) {
              console.log('error', err);
              return err;
            } else {
              return yeastToUpdate.save()
                .then(updated => {
                  console.log('saved', updated);
                  res.statusCode = 200;
                  res.setHeader('content-type', 'application/json');
                  res.json(updated);
                });
            }
          })
        })
        .catch(next);
    } else {
      Yeast.findByIdAndUpdate(req.params.yeastId, req.body, {new: true})
        .then(yeast => {
          if (yeast === null) {
            throw httpError(404, 'Yeast instance not found');
          }

          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(yeast);
        })
        .catch(next);
    }
  })
  .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Yeast.findByIdAndDelete(req.params.yeastId)
      .then(dbres => {
        if (dbres === null) {
          throw httpError(500, 'Failed to delete yeast instance');
        }

        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(dbres);
      })
      .catch(next);
  });

module.exports = yeastRouter;
