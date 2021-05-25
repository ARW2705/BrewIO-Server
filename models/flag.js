'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const flagSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  expiration: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Flag', flagSchema);
