'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const manualStepSchema = require('./manual-step');
const timerStepSchema = require('./timer-step');
const calendarStepSchema = require('./calendar-step');

const processSchema = new Schema({
  type: {
    type: String,
    required: true
  },
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
  startDatetime: {
    type: Date
  },
  endDatetime: {
    type: Date
  },
  duration: {
    type: Number,
    required: true
  },
  splitInterval: {
    type: Number,
    default: 1
  },
  duration: {
    type: Number,
    required: true
  },
  concurrent: {
    type: Boolean,
    default: false
  },
  expectedDuration: {
    type: Number
  }
});

module.exports = processSchema;
