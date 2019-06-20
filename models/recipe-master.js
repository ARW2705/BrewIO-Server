'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const recipeSchema = require('./recipe');

const recipeMasterSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  style: {
    type: Schema.Types.ObjectId,
    ref: 'Style'
  },
  notes: [{
    type: String
  }],
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
  isFriendsOnly: {
    type: Boolean,
    default: false
  },
  recipes: [{
    type: Schema.Types.ObjectId,
    ref: 'Recipe'
  }],
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RecipeMaster', recipeMasterSchema);
