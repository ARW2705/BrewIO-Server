'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const yeastSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  brand: {
    type: String,
    required: true
  },
  form: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  attenuation: {
    type: [Number],
    required: true
  },
  flocculation: {
    type: String,
    default: ''
  },
  optimumTemperature: {
    type: [Number],
    required: true
  },
  alcoholTolerance: {
    type: [Number]
  },
  recommendedStyles: [{
    type: Schema.Types.ObjectId,
    ref: 'Style'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Yeast', yeastSchema);
