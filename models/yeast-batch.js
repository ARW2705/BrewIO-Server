'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const yeastBatchSchema = new Schema({
  cid: {
    type: String,
    default: ''
  },
  yeastType: {
    type: Schema.Types.ObjectId,
    ref: 'Yeast'
  },
  quantity: {
    type: Number,
    required: true
  },
  requiresStarter: {
    type: Boolean,
    default: false
  },
  notes: [{
    type: String
  }]
});

module.exports = yeastBatchSchema;
