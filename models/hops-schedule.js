'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const hopsScheduleSchema = new Schema({
  hopsType: {
    type: Schema.Types.ObjectId,
    ref: 'Hops'
  },
  quantity: {
    type: Number,
    required: true
  },
  addAt: {
    type: Number,
    required: true
  },
  dryHop: {
    type: Boolean,
  }
});

module.exports = hopsScheduleSchema;
