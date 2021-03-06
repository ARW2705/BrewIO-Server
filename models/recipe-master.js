'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const imageSchema = require('./image');
const recipeVariant = require('./recipe-variant');

const recipeSchema = new Schema({
  cid: {
    type: String,
    default: ''
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
    type: String,
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isFriendsOnly: {
    type: Boolean,
    default: false
  },
  labelImage: imageSchema,
  variants: [ recipeVariant ]
}, {
  timestamps: true
});

module.exports = mongoose.model('Recipe', recipeSchema);
