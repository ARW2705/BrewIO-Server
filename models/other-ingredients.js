'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const otherIngredientsSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  units: {
    type: String,
    required: true
  }
});

module.exports = otherIngredientsSchema;
