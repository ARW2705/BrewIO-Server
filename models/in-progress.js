'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const processSchema = require('./process');
const alertSchema = require('./alert');

const inProgressSchema = new Schema({
  currentStep: {
    type: Number,
    default: 0
  },
  alerts: [alertSchema],
  recipe: {
    type: Schema.Types.ObjectId,
    ref: 'recipe',
    required: true
  },
  schedule: [processSchema]
}, {
  timestamps: true
});

module.exports = inProgressSchema;
