'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const calendarStepSchema = new Schema({
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
    type: Date,
    required: true
  },
  endDatetime: {
    type: Date,
    required: true
  },
  splitInterval: {
    type: Number,
    default: 0
  }
});

module.exports = calendarStepSchema;
