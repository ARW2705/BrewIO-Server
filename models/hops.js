'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const hopsSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  alphaAcid: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  usedFor: [{
    type: Schema.Types.ObjectId,
    ref: 'Style'
  }],
  alternatives: [{
    type: Schema.Types.ObjectId,
    ref: 'Hops'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Hops', hopsSchema);
