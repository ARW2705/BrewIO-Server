'use strict';

const createError = require('http-errors');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const async = require('async');

const authenticate = require('../../authenticate');
const Hops = require('../../models/hops');
const Styles = require('../../models/style');

const hopsRouter = express.Router();

hopsRouter.use(bodyParser.json());

hopsRouter.route('/')
  .get((req, res, next) => {
    Hops.find({})
      .populate('usedFor')
      .populate('alternatives')
      .then(hops => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(hops);
      }, error => next(error))
      .catch(error => next(error));
  })
  .post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Hops.create(req.body)
      .then(hops => {
        res.statusCode = 201;
        res.setHeader('content-type', 'application/json');
        res.json(hops);
      }, error => next(error))
      .catch(error => next(error));
  });

hopsRouter.route('/:hopsId')
  .get((req, res, next) => {
    Hops.findById(req.params.hopsId)
      .populate('usedFor')
      .populate('alternatives')
      .then(hops => {
        if (hops != null) {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(hops);
        } else {
          return next(createError(404));
        }
      }, error => next(error))
      .catch(error => next(error))
  })
  .patch(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    if (req.body.usedFor || req.body.alternatives) {
      Hops.findById(req.params.hopsId)
        .then(hopsToUpdate => {
          const calls = [];
          if (hopsToUpdate) {
            if (req.body.usedFor) {
              req.body.usedFor.forEach(name => {
                calls.push(callback => {
                  Styles.find({name: {$regex: name}})
                    .then(styles => {
                      if (styles) {
                        styles.forEach(style => {
                          if (!hopsToUpdate.usedFor.find(elem => elem.equals(style.id))) {
                            hopsToUpdate.usedFor.push(style.id);
                          }
                        });
                        callback(null, true);
                      } else {
                        callback('no styles', null);
                      }
                    });
                })
              })
            }
            if (req.body.alternatives) {
              req.body.alternatives.forEach(name => {
                // change name to title case for query
                name = name
                  .toLowerCase()
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');
                calls.push(callback => {
                  Hops.findOne({name: name})
                    .then(hops => {
                      if (hops != null) {
                        if (!hopsToUpdate.alternatives.find(elem => elem.equals(hops.id))) {
                          hopsToUpdate.alternatives.push(hops.id);
                        }
                        callback(null, true);
                      } else {
                        callback('no hops', null);
                      }
                    });
                });
              });
            }
            return async.parallel(calls, (err, results) => {
              if (err) {
                console.log('error', err);
                return err;
              } else {
                return hopsToUpdate.save()
                  .then(updated => {
                    console.log('saved', updated);
                    res.statusCode = 200;
                    res.setHeader('content-type', 'application/json');
                    res.json(updated);
                  });
              }
            })
          }
        })
        .catch(err => {console.log('err', err); return next(err)});
    } else {
      Hops.findByIdAndUpdate(req.params.hopsId, req.body, {new: true})
        .then(hops => {
          if (hops != null) {
            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            res.json(hops);
          } else {
            return next(createError(404));
          }
        }, error => next(error))
        .catch(error => next(error));
    }
  })
  .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Hops.findByIdAndDelete(req.params.hopsId)
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

module.exports = hopsRouter;
