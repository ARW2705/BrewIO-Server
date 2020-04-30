'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const processSchema = require('./process');
const alertSchema = require('./alert');

const batchSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  currentStep: {
    type: Number,
    default: 0
  },
  alerts: [ alertSchema ],
  recipe: {
    type: Schema.Types.ObjectId,
    required: true
  },
  schedule: [ processSchema ]
}, {
  timestamps: true
});

module.exports = mongoose.model('Batch', batchSchema);
