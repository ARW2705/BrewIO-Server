'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const optionalItemDataSchema = require('./optional-item-data');

const inventorySchema = new Schema({
  cid: {
    type: String,
    required: true
  },
  supplierName: {
    type: String,
    required: true
  },
  stockType: {
    type: String,
    required: true
  },
  initialQuantity: {
    type: Number,
    required: true
  },
  currentQuantity: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  itemName: {
    type: String,
    required: true
  },
  itemStyleId: {
    type: Schema.Types.ObjectId,
    ref: 'Style'
  },
  itemStyleName: {
    type: String,
    required: true
  },
  itemABV: {
    type: Number,
    required: true
  },
  sourceType: {
    type: String,
    required: true
  },
  optionalItemData: optionalItemDataSchema
}, {
  timestamps: true
});

module.exports = mongoose.model('Inventory', inventorySchema);
