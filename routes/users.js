'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');

const User = require('../models/user');
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
        res.json({error: error});
      } else {
        if (req.body.firstname) user.firstname = req.body.firstname;
        if (req.body.lastname) user.lastname = req.body.lastname;
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

module.exports = userRouter;
