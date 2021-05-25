'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const primaryValuesSchema = require('./primary-values');

const annotationsSchema = new Schema({
  styleId: {
    type: Schema.Types.ObjectId,
    ref: 'Style',
    required: true
  },
  targetValues: primaryValuesSchema,
  measuredValues: primaryValuesSchema,
  notes: [{
    type: String
  }],
  packagingDate: {
    type: Date
  }
}, {
  _id: false
});

module.exports = annotationsSchema;
