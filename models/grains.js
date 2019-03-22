'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const grainSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  lovibond: {
    type: Number,
    required: true
  },
  gravity: {
    type: Number,
    required: true
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Grains', grainSchema);
