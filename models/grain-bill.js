'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const grains = require('./grains');

const grainBillSchema = new Schema({
  grainType: {
    type: Schema.Types.ObjectId,
    ref: 'Grains'
  },
  quantity: {
    type: Number,
    required: true
  },
  mill: {
    type: Number
  },
  notes: [{
    type: String
  }]
});

module.exports = grainBillSchema;
