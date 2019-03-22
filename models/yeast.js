'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const yeastSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
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
    required: true
  },
  optimumTemperature: {
    type: [Number],
    required: true
  },
  alcoholTolerance: {
    type: [Number]
  },
  recommendedStyles: [{
    style: {
      type: Schema.Types.ObjectId,
      ref: 'Style',
      unique: true
    },
    ideal: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Yeast', yeastSchema);
