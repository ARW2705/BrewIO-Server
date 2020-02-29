'use strict';

const createError = require('http-errors');
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
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(yeast);
      })
      .catch(error => next(error));
  })
  .post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Yeast.create(req.body)
      .then(yeast => {
        res.statusCode = 201;
        res.setHeader('content-type', 'application/json');
        res.json(yeast);
      })
      .catch(error => next(error));
  });

yeastRouter.route('/:yeastId')
  .get((req, res, next) => {
    Yeast.findById(req.params.yeastId)
      .populate('recommendedStyles')
      .then(yeast => {
        if (yeast !== null) {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(yeast);
        } else {
          return next(createError(404));
        }
      })
      .catch(error => next(error))
  })
  .patch(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    if (req.body.styles) {
      Yeast.findById(req.params.yeastId)
        .then(yeastToUpdate => {
          const calls = [];
          if (yeastToUpdate !== null) {
            req.body.styles.forEach(name => {
              calls.push(callback => {
                Styles.findOne({name: name})
                  .then(style => {
                    if (style !== null) {
                      if (!yeastToUpdate.recommendedStyles.find(elem => elem.equals(style.id))) {
                        yeastToUpdate.recommendedStyles.push(style.id);
                      }
                      callback(null, true);
                    } else {
                      callback('Style not found', null);
                    }
                  });
              })
            })
          }
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
        .catch(error => next(error));
    } else {
      Yeast.findByIdAndUpdate(req.params.yeastId, req.body, {new: true})
        .then(yeast => {
          if (yeast !== null) {
            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            res.json(yeast);
          } else {
            return next(createError(404));
          }
        })
        .catch(error => next(error));
    }
  })
  .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Yeast.findByIdAndDelete(req.params.yeastId)
      .then(dbres => {
        if (dbres !== null) {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(dbres);
        } else {
          return next(createError(404));
        }
      })
      .catch(error => next(error));
  });

module.exports = yeastRouter;
