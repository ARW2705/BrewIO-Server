'use strict';

const httpError = require('../../utils/http-error');
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
        if (hops === null || hops.length === 0) {
          throw throwError(404, 'Hops entries not found');
        }

        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(hops);
      })
      .catch(next);
  })
  .post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Hops.create(req.body)
      .then(hops => {
        if (hops === null) {
          throw throwError(500, 'Failed to create new hops instance');
        }

        res.statusCode = 201;
        res.setHeader('content-type', 'application/json');
        res.json(hops);
      })
      .catch(next);
  });

hopsRouter.route('/:hopsId')
  .get((req, res, next) => {
    Hops.findById(req.params.hopsId)
      .populate('usedFor')
      .populate('alternatives')
      .then(hops => {
        if (hops === null) {
          throw throwError(404, 'Hops instance not found');
        }

        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(hops);
      })
      .catch(next)
  })
  .patch(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    if (req.body.usedFor || req.body.alternatives) {
      Hops.findById(req.params.hopsId)
        .then(hopsToUpdate => {
          if (hopsToUpdate === null) {
            throw throwError(404, 'Hops instance not found');
          }

          const calls = [];

          // construct queries for Styles to search and then populate hops doc
          // with matched Style ids - to be called later once all queries are ready
          if (req.body.usedFor) {
            req.body.usedFor.forEach(name => {
              calls.push(callback => {
                Styles.find({name: {$regex: name}})
                  .then(styles => {
                    if (styles === null) {
                      callback('no styles', null);
                    } else {
                      styles.forEach(style => {
                        if (!hopsToUpdate.usedFor.find(elem => elem.equals(style.id))) {
                          hopsToUpdate.usedFor.push(style.id);
                        }
                      });
                      callback(null, true);
                    }
                  });
              })
            })
          }

          // construct queries for Hops to search and then populate hops doc
          // with other hops docs that can be used as an alternative for given hops
          if (req.body.alternatives) {
            req.body.alternatives.forEach(name => {
              // change name to title case for query
              name =  name
                      .toLowerCase()
                      .split(' ')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ');

              calls.push(callback => {
                Hops.findOne({name: name})
                  .then(hops => {
                    if (hops === null) {
                      callback('no hops', null);
                    } else {
                      if (!hopsToUpdate.alternatives.find(elem => elem.equals(hops.id))) {
                        hopsToUpdate.alternatives.push(hops.id);
                      }
                      callback(null, true);
                    }
                  });
              });
            });
          }

          // Perform all pre-made queries, then respond with original hops save result
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
        })
        .catch(next);
    } else {
      Hops.findByIdAndUpdate(req.params.hopsId, req.body, {new: true})
        .then(hops => {
          if (hops === null) {
            throw throwError(404, 'Hops instance not found');
          }

          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(hops);
        })
        .catch(next);
    }
  })
  .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Hops.findByIdAndDelete(req.params.hopsId)
      .then(dbres => {
        if (dbres === null) {
          throw throwError(500, 'Failed to delete hops instance');
        }

        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(dbres);
      })
      .catch(next);
  });

module.exports = hopsRouter;
