'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const timerStepSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  description: {
    type: String
  },
  duration: {
    type: Number,
    required: true
  },
  splitInterval: {
    type: Number,
    default: 0
  }
});

module.exports = timerStepSchema;
