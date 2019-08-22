'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const inventorySchema = new Schema({
  itemCount: {
    type: Number,
    required: true
  },
  purchaseDate: {
    type: Date
  },
  packagedDate: {
    type: Date
  },
  details: {
    type: Schema.Types.ObjectId,
    ref: 'BeerData'
  }
}, {
  timestamps: true
});

module.exports = inventorySchema;
