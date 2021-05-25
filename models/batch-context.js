'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const grainBillSchema = require('./grain-bill');
const hopsScheduleSchema = require('./hops-schedule');
const yeastBatchSchema = require('./yeast-batch');
const otherIngredientsSchema = require('./other-ingredients');
const imageSchema = require('./image');

const contextSchema = new Schema({
  recipeMasterName: {
    type: String,
    required: true
  },
  recipeVariantName: {
    type: String,
    required: true
  },
  recipeImage: imageSchema,
  boilVolume: {
    type: Number,
    required: true
  },
  batchVolume: {
    type: Number,
    required: true
  },
  grains: [ grainBillSchema ],
  hops: [ hopsScheduleSchema ],
  yeast: [ yeastBatchSchema ],
  otherIngredients: [ otherIngredientsSchema ]
}, {
  _id: false
});

module.exports = contextSchema;
