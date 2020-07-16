'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const primaryValuesSchema = new Schema({
  efficiency: {
    type: Number,
    default: 70
  },
  originalGravity: {
    type: Number,
    default: 0
  },
  finalGravity: {
    type: Number,
    default: 0
  },
  batchVolume: {
    type: Number,
    default: 0
  },
  ABV: {
    type: Number,
    default: 0
  },
  IBU: {
    type: Number,
    default: 0
  },
  SRM: {
    type: Number,
    default: 0
  }
});

module.exports = primaryValuesSchema;
