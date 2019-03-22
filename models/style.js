'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const styleSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  originalGravity: {
    type: [Number],
    required: true
  },
  finalGravity: {
    type: [Number],
    required: true
  },
  IBU: {
    type: [Number],
    required: true
  },
  SRM: {
    type: [Number],
    required: true
  },
  co2Volume: {
    type: [Number],
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Style', styleSchema);
