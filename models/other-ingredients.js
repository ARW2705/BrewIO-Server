'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const otherIngredientsSchema = new Schema({
  cid: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    required: true
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
}, {
  _id: false
});

module.exports = otherIngredientsSchema;
