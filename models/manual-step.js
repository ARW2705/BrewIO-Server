'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const manualStepSchema = new Schema({
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
  expectedDuration: {
    type: Number
  }
});

module.exports = manualStepSchema;
