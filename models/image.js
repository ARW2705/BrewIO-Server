'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const imageSchema = new Schema({
  cid: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    default: ''
  },
  hasPending: {
    type: Boolean
  },
  localURL: {
    type: String,
    default: ''
  },
  serverFilename: {
    type: String
  },
  url: {
    type: String,
    default: ''
  }
}, {
  _id: false
});

module.exports = imageSchema;
