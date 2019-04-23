'use strict';

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const passport = require('passport');

const apiVersion = 'brew_io_api_v1.0.0';

var indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const recipeRouter = require('./routes/recipe');
const processRouter = require('./routes/process');
const grainsRouter = require('./routes/library/grains');
const hopsRouter = require('./routes/library/hops');
const yeastRouter = require('./routes/library/yeast');
const styleRouter = require('./routes/library/style');

const connect = mongoose.connect(
  process.env.MONGO_URL,
  {
    keepAlive: true,
    keepAliveInitialDelay: 300000,
    useNewUrlParser: true
  }
);
connect.then(() => {
  console.log('BrewIO database connection established');
}, error => console.log(error));

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(bodyParser.json());
app.use(logger('dev'));
app.use(express.json());
app.use(passport.initialize());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use(`/${apiVersion}/library/grains`, grainsRouter);
app.use(`/${apiVersion}/library/hops`, hopsRouter);
app.use(`/${apiVersion}/library/yeast`, yeastRouter);
app.use(`/${apiVersion}/library/style`, styleRouter);

app.use(`/${apiVersion}/users`, usersRouter);
app.use(`/${apiVersion}/recipes`, recipeRouter);
app.use(`/${apiVersion}/process`, processRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

app.use((err, req, res, next) => {
  if (err.name == 'ValidationError' || err.name == 'MongoError') {
    console.log('Mongo error', err);
    res.statusCode = 503;
    res.setHeader('content-type', 'application/json');
    res.json(err);
  } else {
    next(err);
  }
});

// error handler
app.use(function(err, req, res, next) {
  console.log('Error', err);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
