'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');

const User = require('../models/user');
const RecipeMaster = require('../models/recipe-master');
const authenticate = require('../authenticate');

const userRouter = express.Router();

userRouter.use(bodyParser.json());

userRouter.get('/checkJWTToken', (req, res) => {
  passport.authenticate('jwt', {session: false}, (error, user, data) => {
    if (error) return next(error);
    if (!user) {
      res.statusCode = 401;
      res.setHeader('content-type', 'application/json');
      return res.json({status: 'JWT invalid', success: false, error: data});
    } else {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      return res.json({status: 'JWT valid', success: true, user: user});
    }
  })(req, res);
});

userRouter.post('/login', (req, res, next) => {
  passport.authenticate('local', (error, user, data) => {
    if (error) return next(error);
    if (!user) {
      res.statusCode = 401;
      res.setHeader('content-type', 'application/json');
      res.json({success: false, status: 'Login Unsuccessful', error: data});
    }
    req.logIn(user, error => {
      if (error) return next(error);
      const token = authenticate.getToken({_id: req.user._id});
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.json({success: true, token: token, status: 'Successfully logged in'});
    });
  })(req, res, next);
});

userRouter.post('/signup', (req, res, next) => {
  User.register(new User({username: req.body.username}), req.body.password,
    (error, user) => {
      if (error) {
        res.statusCode = 500;
        res.setHeader('content-type', 'application/json');
        res.json(error);
      } else {
        console.log('signup', user, req.body);
        if (req.body.firstname) user.firstname = req.body.firstname;
        if (req.body.lastname) user.lastname = req.body.lastname;
        if (req.body.email) user.email = req.body.email;
        user.save((error, user) => {
          if (error) {
            res.statusCode = 500;
            res.setHeader('content-type', 'application/json');
            res.json({error: error});
            return;
          }
          passport.authenticate('local')(req, res, () => {
            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            res.json({success: true, status: 'Registration successful'});
          });
        });
      }
    });
});

userRouter.route('/profile')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .populate({
        path: 'masterList',
        populate: {
          path: 'style'
        }
      })
      .populate({
        path: 'masterList',
        populate: {
          path: 'recipes',
          populate: {
            path: 'grains.grainType'
          }
        }
      })
      .populate({
        path: 'masterList',
        populate: {
          path: 'recipes',
          populate: {
            path: 'hops.hopsType'
          }
        }
      })
      .populate({
        path: 'masterList',
        populate: {
          path: 'recipes',
          populate: {
            path: 'yeast.yeastType'
          }
        }
      })
      .then(user => {
        const response = {
          username: user.username,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          masterList: user.masterList,
          inProgressList: user.inProgressList
        };
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(response);
      })
      .catch(error => next(error));
  })
  .patch(authenticate.verifyUser, (req, res, next) => {
    User.findByIdAndUpdate(req.user.id, req.body, {new: true})
      .then(update => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(update);
      })
      .catch(error => next(error));
  });

// TODO add user profile routes

module.exports = userRouter;
