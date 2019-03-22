'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const recipeSchema = require('./recipe');

const recipeMasterSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  style: {
    type: Schema.Types.ObjectId,
    ref: 'Style'
  },
  notes: {
    type: String,
    default: ''
  },
  master: {
    type: Schema.Types.ObjectId,
    ref: 'Recipe'
  },
  hasActiveBatch: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  recipes: [recipeSchema]
}, {
  timestamps: true
});

module.exports = recipeMasterSchema;
