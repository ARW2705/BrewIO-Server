'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const alertSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  datetime: {
    type: Date,
    required: true
  }
});

module.exports = alertSchema;
