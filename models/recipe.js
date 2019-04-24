'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const grainBillSchema = require('./grain-bill');
const hopsScheduleSchema = require('./hops-schedule');
const yeastBatchSchema = require('./yeast-batch');
const otherIngredientsSchema = require('./other-ingredients');
const processSchema = require('./process');

const recipeSchema = new Schema({
  variantName: {
    type: String,
    default: 'initial'
  },
  notes: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: false
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  isMaster: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number
  },
  efficiency: {
    type: Number,
    default: 70
  },
  brewingType: {
    type: String,
    required: true
  },
  batchVolume: {
    type: Number,
    required: true
  },
  boilVolume: {
    type: Number,
    required: true
  },
  mashVolume: {
    type: Number,
    required: true
  },
  originalGravity: {
    type: Number,
    required: true
  },
  finalGravity: {
    type: Number,
    required: true
  },
  ABV: {
    type: Number,
    required: true
  },
  IBU: {
    type: Number,
    required: true
  },
  SRM: {
    type: Number,
    required: true
  },
  currentStep: {
    type: Number,
    default: 0
  },
  grains: [grainBillSchema],
  hops: [hopsScheduleSchema],
  yeast: [yeastBatchSchema],
  otherIngredients: [otherIngredientsSchema],
  processSchedule: [processSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Recipe', recipeSchema);
