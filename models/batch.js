'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const annotationsSchema = require('./batch-annotations');
const processSchema = require('./process');
const contextSchema = require('./batch-context');

const batchSchema = new Schema({
  cid: {
    type: String,
    default: ''
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipeMasterId: {
    type: String,
    required: true
  },
  recipeVariantId: {
    type: String,
    required: true
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  annotations: annotationsSchema,
  process: processSchema,
  contextInfo: contextSchema
  // currentStep: {
  //   type: Number,
  //   default: 0
  // },
  // alerts: [ alertSchema ],
  // recipe: {
  //   type: String,
  //   required: true
  // },
  // schedule: [ processSchema ]
}, {
  timestamps: true
});

module.exports = mongoose.model('Batch', batchSchema);
