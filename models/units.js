'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const unitsSchema = new Schema({
  volume: {
    type: String,
    required: true
  },
  weight: {
    type: String,
    required: true
  },
  temperature: {
    type: String,
    required: true
  },
  specificGravity: {
    type: String,
    required: true
  }
});

module.exports = unitsSchema;
