'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const unitSchema = new Schema({
  system: {
    type: String,
    default: 'english standard'
  },
  longName: {
    type: String,
    required: true
  },
  shortName: {
    type: String,
    required: true
  },
  symbol: {
    type: String
  }
});

const selectedUnitsSchema = new Schema({
  system: {
    type: String,
    default: 'english standard'
  },
  weightSmall: {
    type: unitSchema,
    required: true
  },
  weightLarge: {
    type: unitSchema,
    required: true
  },
  volumeSmall: {
    type: unitSchema,
    required: true
  },
  volumeLarge: {
    type: unitSchema,
    required: true
  },
  temperature: {
    type: unitSchema,
    required: true
  },
  density: {
    type: unitSchema,
    required: true
  }
});

module.exports = selectedUnitsSchema;
