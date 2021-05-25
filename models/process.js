'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const stepSchema = require('./step');
const alertSchema = require('./alert');

const processSchema = new Schema({
  currentStep: {
    type: Number,
    required: true
  },
  schedule: [ stepSchema ],
  alerts: [ alertSchema ]
}, {
  _id: false
});

module.exports = processSchema;
