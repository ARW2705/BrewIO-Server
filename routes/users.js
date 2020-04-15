'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');

const User = require('../models/user');
const RecipeMaster = require('../models/recipe-master');
const authenticate = require('../authenticate');

const userRouter = express.Router();

userRouter.use(bodyParser.json());

userRouter.get('/checkJWToken', (req, res) => {
  passport.authenticate('jwt', {session: false}, (error, user, data) => {
    if (error) return next(error);
    if (!user) {
      res.statusCode = 401;
      res.setHeader('content-type', 'application/json');
      return res.json({status: 'JWT invalid', success: false, user: null, error: data});
    } else {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      return res.json({status: 'JWT valid', success: true, user: user, error: null});
    }
  })(req, res);
});

userRouter.post('/login', (req, res, next) => {
  passport.authenticate('local', (error, user, data) => {
    if (error) return next(error);
    if (!user) {
      res.statusCode = 401;
      res.setHeader('content-type', 'application/json');
      return res.json({success: false, status: 'Login Unsuccessful', error: data});
    }
    req.logIn(user, error => {
      if (error) return next(error);
      const token = authenticate.getToken({_id: req.user._id});
      return User.findById(user._id)
        .then(userProfile => {
          const _user = {
            _id: userProfile._id,
            username: userProfile.username,
            firstname: userProfile.firstname || undefined,
            lastname: userProfile.lastname || undefined,
            email: userProfile.email || undefined,
            friendList: userProfile.friendList,
            token: token
          };
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          return res.json({success: true, status: 'Login Successful', user: _user});
        });
    });
  })(req, res, next);
});

userRouter.post('/signup', async(req, res, next) => {
  const users = await User.find({});
  if (users.length > 5) {
    res.statusCode = 423;
    res.setHeader('content-type', 'application/json');
    return res.json({success: false, status: 'Max users reached: contact admin'});
  }
  User.register(new User({username: req.body.username, email: req.body.email}), req.body.password,
    (error, user) => {
      if (error) {
        res.statusCode = 500;
        res.setHeader('content-type', 'application/json');
        res.json(error);
      } else {
        console.log('signup', user, req.body);
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
      .populate({
        path: 'inProgressList',
        populate: 'recipe'
      })
      .populate({
        path: 'inventoryList',
        populate: 'itemDetails.master itemDetails.recipe'
      })
      .then(user => {
        if (user !== null) {
          const response = {
            _id: user._id,
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            masterList: user.masterList,
            inProgressList: user.inProgressList,
            inventoryList: user.inventoryList
          };
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(response);
        } else {
          return next(createError(404, 'User not found'));
        }
      })
      .catch(error => next(error));
  })
  .patch(authenticate.verifyUser, (req, res, next) => {
    User.findByIdAndUpdate(req.user.id, req.body, {new: true})
      .then(update => {
        if (update !== null) {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.json(update);
        } else {
          return next(createError(500, 'Failed to update User'));
        }
      })
      .catch(error => next(error));
  });

// TODO add user profile routes

module.exports = userRouter;
