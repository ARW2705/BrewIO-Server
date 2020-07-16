'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const primaryValuesSchema = require('./primary-values');
const unitsSchema = require('./units');

const annotationsSchema = new Schema({
  styleId: {
    type: Schema.Types.ObjectId,
    ref: 'Style',
    required: true
  },
  units: unitsSchema,
  targetValues: primaryValuesSchema,
  measuredValues: primaryValuesSchema,
  notes: [{
    type: String
  }],
  packagingDate: {
    type: Date
  }
});

module.exports = annotationsSchema;
