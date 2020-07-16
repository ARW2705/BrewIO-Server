'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const contextSchema = new Schema({
  recipeMasterName: {
    type: String,
    required: true
  },
  recipeVariantName: {
    type: String,
    required: true
  },
  recipeImageURL: {
    type: String,
    required: true
  }
});

module.exports = contextSchema;
