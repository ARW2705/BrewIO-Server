'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const hopsScheduleSchema = new Schema({
  cid: {
    type: String,
    default: ''
  },
  hopsType: {
    type: Schema.Types.ObjectId,
    ref: 'Hops'
  },
  quantity: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  dryHop: {
    type: Boolean,
    default: false
  },
  notes: [{
    type: String
  }]
}, {
  _id: false
});

module.exports = hopsScheduleSchema;
