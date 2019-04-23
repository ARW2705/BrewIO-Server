'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const yeastBatchSchema = new Schema({
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
    required: true,
    default: false
  },
  notes: [{
    type: String
  }]
});

module.exports = yeastBatchSchema;
