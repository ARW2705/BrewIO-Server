'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const alertSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  datetime: {
    type: String,
    required: true
  }
});

module.exports = alertSchema;
