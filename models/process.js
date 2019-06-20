'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const processSchema = new Schema({
  type: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  splitInterval: {
    type: Number,
    default: 1
  },
  duration: {
    type: Number,
    default: 0
  },
  concurrent: {
    type: Boolean,
    default: false
  },
  startDatetime: {
    type: Date
  },
  expectedDuration: {
    type: Number
  }
});

module.exports = processSchema;
