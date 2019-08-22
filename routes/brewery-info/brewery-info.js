'use strict';

/* Module dependencies */

const createError = require('create-error');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

/* Authentication utils */

const authenticate = require('../../authenticate');

/* Mongoose models */

const BeerData = require('../../models/brewery-info/beer');
const Brewery = require('../../models/brewery-info/brewery');

/* Router initialization */

const breweryInformationRouter = express.Router();

breweryInformationRouter.use(bodyParser.json());

/* Routes */


/* Beer detail routes */

breweryInformationRouter.route('/beer/')
  .get(authenticate.verifyUser, (req,res,next) => {
    const queryParams = validateQueryParams(req.body.queryParams);
    BeerData.find(queryParams.criteria).limit(queryParams.limit).sort(queryParams.sort)
      .then(beerList => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(beerList);
      })
      .catch(error => next(error));
  })
  .post(authenticate.verifyUser, authenticate.verifyEditor, (req, res, next) => {
    BeerData.create(req.body)
      .then(newBeer => {
        return Brewery.findById(newBeer.brewery)
          .then(brewery => {
            brewery.beerList.push(newBeer.id);
            return brewery.save()
              .then(_ => {
                res.statusCode = 201;
                res.setHeader('content-type', 'application/json');
                res.json(newBeer);
              })
          })
      })
      .catch(error => next(error));
  });

breweryInformationRouter.route('/beer/:beerId')
  .get(authenticate.verifyUser, (req, res, next) => {
    BeerData.find({id: req.params.beerId})
      .then(beer => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(beer);
      })
      .catch(error => next(error));
  })
  .patch(authenticate.verifyUser, authenticate.verifyEditor, (req, res, next) => {
    BeerData.findByIdAndUpdate(req.params.beerId, req.body, {new: true})
      .then(updatedBeer => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(updatedBeer);
      })
      .catch(error => next(error));
  })
  .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    BeerData.deleteById(req.params.beerId)
      .then(dbres => {
        return Brewery.findById(dbres.brewery)
          .then(brewery => {
            const toDelete = brewery.beerList.findIndex(beer => beer._id === req.params.beerId);
            brewery.beerList.splice(toDelete, 1);
            return brewery.save()
              .then(_ => {
                res.statusCode = 200;
                res.setHeader('content-type', 'application/json');
                res.json({success: true});
              })
          })
      })
      .catch(error => next(error));
  });

// End beer detail routes


/* Brewery detail routes */

breweryInformationRouter.route('/brewery/')
  .get(authenticate.verifyUser, (req, res, next) => {
    const queryParams = validateQueryParams(req.body.queryParams);
    Brewery.find(queryParams.criteria).limit(queryParams.limit).sort(queryParams.sort)
      .then(breweryList => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(breweryList);
      })
      .catch(error => next(error));
  })
  .post(authenticate.verifyUser, authenticate.verifyEditor, (req, res, next) => {
    Brewery.create(req.body)
      .then(brewery => {
        res.statusCode = 201;
        res.setHeader('content-type', 'application/json');
        res.json(brewery);
      })
      .catch(error => next(error));
  });

breweryInformationRouter.route('/brewery/:breweryId')
  .get(authenticate.verifyUser, (req, res, next) => {
    Brewery.findById(req.params.breweryId)
      .then(brewery => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(brewery);
      })
      .catch(error => next(error));
  })
  .patch(authenticate.verifyUser, authenticate.verifyEditor, (req, res, next) => {
    Brewery.findByIdAndUpdate(req.params.breweryId, req.body, {new: true})
      .then(updatedBrewery => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(updatedBrewery);
      })
      .catch(error => next(error));
  })
  .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Brewery.findByIdAndDelete(req.params.breweryId)
      .then(dbres => {
        return BeerData.deleteMany({brewery: dbres.id})
          .then(multiDBres => {
            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            res.json({success: true});
          })
      })
      .catch(error => next(error));
  });

// End beer detail routes

module.exports = breweryInformationRouter;
